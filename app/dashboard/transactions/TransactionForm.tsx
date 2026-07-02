"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCamera,
  faCircleInfo,
  faMagic,
  faPlus,
  faSpinner,
  faTriangleExclamation,
  faWandSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { createTransaction, TransactionActionState } from "./actions";
import { TransactionCategory } from "./transaction-types";
import { extractBillData } from "@/services/ai.service";

export default function TransactionForm({
  categories,
  onSuccess,
  timezone = "UTC",
}: {
  categories: TransactionCategory[];
  onSuccess: () => void;
  timezone?: string;
}) {
  const [state, action, pending] = useActionState<
    TransactionActionState,
    FormData
  >(createTransaction, undefined);
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categorizingLoading, setCategorizingLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [aiCategoryRaw, setAiCategoryRaw] = useState("");
  const [aiConfidenceScore, setAiConfidenceScore] = useState("");

  // OCR-specific state. Separate from aiMessage so a low-confidence OCR
  // warning doesn't get silently cleared the next time the category
  // Select's onValueChange resets aiMessage.
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrWarning, setOcrWarning] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [billImagePreview, setBillImagePreview] = useState<string | null>(null);

  const amountRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const billFileInputRef = useRef<HTMLInputElement>(null);
  const anomalyCheckTransactionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!state?.success || !state.transactionId) {
      return;
    }

    if (anomalyCheckTransactionIdRef.current === state.transactionId) {
      return;
    }

    anomalyCheckTransactionIdRef.current = state.transactionId;

    const runAnomalyCheck = async () => {
      try {
        const response = await fetch("/api/ai/anomaly/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactionId: state.transactionId }),
        });

        if (!response.ok) {
          throw new Error("Failed to check transaction anomaly");
        }
      } catch (error) {
        console.error("Anomaly check error:", error);
      } finally {
        onSuccess();
      }
    };

    void runAnomalyCheck();
  }, [onSuccess, state?.success, state?.transactionId]);

  const findCategoryByName = (name: string) =>
    categories.find((c) => c.name.toLowerCase() === name.toLowerCase());

  const handleAutoCategorize = async (descriptionVal: string) => {
    const trimmed = descriptionVal.trim();
    if (!trimmed) return;

    setCategorizingLoading(true);
    setAiMessage("");
    try {
      const response = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: trimmed }),
      });

      if (!response.ok) throw new Error("Failed to categorize");

      const data = await response.json();
      const categoryName = data.category;
      const confidence =
        typeof data.confidence === "number" ? String(data.confidence) : "";

      setAiCategoryRaw(typeof categoryName === "string" ? categoryName : "");
      setAiConfidenceScore(confidence);

      if (
        !categoryName ||
        typeof categoryName !== "string" ||
        categoryName.toLowerCase() === "uncategorized"
      ) {
        setAiMessage("Cant help with that");
        return;
      }

      const matchingCategory = findCategoryByName(categoryName);
      if (!matchingCategory) {
        setAiMessage("Cant help with that");
        return;
      }

      setCategoryId(matchingCategory.id);
      setAiMessage(`AI selected ${matchingCategory.name}.`);
    } catch (error) {
      console.error("Categorization error:", error);
      setAiMessage("Failed to auto-categorize. Please choose a category.");
    } finally {
      setCategorizingLoading(false);
    }
  };

  // Run auto-categorization when description changes (debounced)
  useEffect(() => {
    const trimmed = description.trim();
    if (!trimmed) {
      return;
    }

    const handler = setTimeout(() => {
      void handleAutoCategorize(trimmed);
    }, 600);

    return () => {
      clearTimeout(handler);
    };
  }, [description]);

  // Mirrors handleAutoCategorize's structure closely: same hidden-input
  // population (aiCategoryRaw, aiConfidenceScore), same findCategoryByName
  // lookup, same aiMessage feedback line. The difference is OCR also
  // fills description/amount/date via refs since those are uncontrolled
  // inputs in this form (no value= prop, just defaultValue on date).
  const processBillFile = async (file: File) => {
    setOcrLoading(true);
    setOcrWarning("");
    setAiMessage("");

    try {
      const data = await extractBillData(file);

      if (!data) {
        setOcrWarning("Could not read the bill. Please enter details manually.");
        return;
      }

      if (data.description) {
        setDescription(data.description);
      }
      if (amountRef.current && data.amount !== null) {
        amountRef.current.value = String(data.amount);
      }
      if (dateRef.current && data.date) {
        dateRef.current.value = data.date;
      }

      const categoryName = data.category;
      const confidence =
        typeof data.confidence === "number" ? String(data.confidence) : "";

      setAiCategoryRaw(typeof categoryName === "string" ? categoryName : "");
      setAiConfidenceScore(confidence);

      if (
        categoryName &&
        typeof categoryName === "string" &&
        categoryName.toLowerCase() !== "uncategorized"
      ) {
        const matchingCategory = findCategoryByName(categoryName);
        if (matchingCategory) {
          setCategoryId(matchingCategory.id);
          setAiMessage(`AI selected ${matchingCategory.name}.`);
        }
      }

      // Surface a warning if OCR text quality or category confidence was
      // low, so the user double-checks the pre-filled fields before
      // submitting — same instinct as the existing "Cant help with that"
      // message, but specific to OCR since two models are now chained.
      if (data.ocr_low_confidence) {
        setOcrWarning(
          "Bill photo was hard to read — please verify the amount and date."
        );
      } else if (data.amount === null) {
        setOcrWarning("Couldn't find an amount on the bill — please enter it manually.");
      }
    } catch (error) {
      console.error("OCR error:", error);
      setOcrWarning("Failed to read bill. Please enter details manually.");
    } finally {
      setOcrLoading(false);
      if (billFileInputRef.current) {
        billFileInputRef.current.value = "";
      }
    }
  };

  const handleBillUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBillImagePreview(URL.createObjectURL(file));
    void processBillFile(file);
  };

  const clearBillImage = () => {
    if (billImagePreview) {
      URL.revokeObjectURL(billImagePreview);
    }
    setBillImagePreview(null);
    setOcrWarning("");
    setOcrLoading(false);
    if (billFileInputRef.current) {
      billFileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setBillImagePreview(URL.createObjectURL(file));
    void processBillFile(file);
  };

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: timezone,
  });

  const clientTimestampRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!categoryId) {
      setAiMessage("Please choose a category.");
      e.preventDefault();
    }
    const now = new Date();
    const localStr = new Date(
      now.getTime() - now.getTimezoneOffset() * 60000,
    ).toISOString();
    if (clientTimestampRef.current) {
      clientTimestampRef.current.value = localStr;
    }
  };

  return (
    <form
      action={action}
      onSubmit={handleSubmit}
      className="rounded-lg bg-card p-1"
    >
      {state?.message && (
        <div className="mb-4 rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">
          {state.message}
        </div>
      )}
      <input ref={clientTimestampRef} type="hidden" name="clientTimestamp" />
      <input
        type="hidden"
        name="isAiCategorized"
        value={aiCategoryRaw && categoryId ? "true" : ""}
      />
      <input type="hidden" name="aiCategoryRaw" value={aiCategoryRaw} />
      <input type="hidden" name="aiConfidenceScore" value={aiConfidenceScore} />

      <div className="flex flex-col md:flex-row gap-5 max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-visible p-1.5">
        {/* Left Side: Optional File Input / Bill Scanner */}
        <div className="flex flex-col gap-1.5 w-full md:w-5/12 lg:w-1/3 shrink-0">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Upload Bill (Optional)
          </Label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !billImagePreview && billFileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed p-4 transition-colors text-center min-h-[140px] md:h-full md:min-h-[220px] overflow-hidden ${isDragging
              ? "border-primary bg-primary/10"
              : billImagePreview
                ? "border-muted-foreground/30 bg-muted/30"
                : "border-muted-foreground/30 bg-muted/30 hover:bg-muted/50 cursor-pointer"
              }`}
          >
            <input
              ref={billFileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              capture="environment"
              onChange={handleBillUpload}
              className="hidden"
              id="bill-upload-input"
            />
            {billImagePreview ? (
              <>
                <img
                  src={billImagePreview}
                  alt="Bill preview"
                  className="absolute inset-0 h-full w-full object-contain rounded-lg"
                />
                {ocrLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-black/50">
                    <FontAwesomeIcon icon={faSpinner} className="h-6 w-6 animate-spin text-white" />
                    <p className="text-xs font-medium text-white">Reading bill...</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearBillImage();
                  }}
                  className="absolute top-1.5 right-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white text-xs hover:bg-black/70 transition-colors"
                  aria-label="Remove bill image"
                >
                  ✕
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <div className="rounded-full bg-primary/10 p-2.5 text-primary">
                  {ocrLoading ? (
                    <FontAwesomeIcon icon={faSpinner} className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <FontAwesomeIcon icon={faCamera} className="h-4.5 w-4.5" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium">
                    {ocrLoading ? "Reading bill..." : "Scan or upload bill"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Drag & drop or click
                  </p>
                </div>
              </div>
            )}
          </div>
          {ocrWarning && (
            <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500">
              <FontAwesomeIcon icon={faTriangleExclamation} className="h-3.5 w-3.5" />
              {ocrWarning}
            </p>
          )}
        </div>

        {/* Right Side: Form Inputs */}
        <div className="flex-1 space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Transaction Details
          </Label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Grocery shopping"
                required
                className="h-9"
              />
              {state?.errors?.description && (
                <p className="text-xs text-destructive">
                  {state.errors.description[0]}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                ref={amountRef}
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                required
                className="h-9"
              />
              {state?.errors?.amount && (
                <p className="text-xs text-destructive">{state.errors.amount[0]}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="type">Type *</Label>
              <Select name="type" defaultValue="EXPENSE" required>
                <SelectTrigger id="type" className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                  <SelectItem value="INCOME">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="date">Date *</Label>
              <Input
                ref={dateRef}
                id="date"
                name="date"
                type="date"
                defaultValue={today}
                required
                className="h-9"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="category">Category *</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select
                  name="categoryId"
                  value={categoryId}
                  onValueChange={(value) => {
                    setCategoryId(value);
                    setAiMessage("");
                  }}
                >
                  <SelectTrigger id="category" className="h-9 w-full">
                    <SelectValue
                      placeholder="Select a category"
                    />
                  </SelectTrigger>
                  <SelectContent className="min-w-64">
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {aiMessage && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {categorizingLoading ? (
                    <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FontAwesomeIcon icon={faCircleInfo} className="h-3.5 w-3.5" />
                  )}
                  {aiMessage}
                </p>
              )}
              {state?.errors?.categoryId && (
                <p className="text-xs text-destructive">
                  {state.errors.categoryId[0]}
                </p>
              )}
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Optional notes..."
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={pending} className="h-9 gap-2 w-full sm:w-auto">
              {pending ? (
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="h-3.5 w-3.5 animate-spin"
                />
              ) : (
                <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />
              )}
              Add Transaction
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
