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
  faCircleInfo,
  faMagic,
  faPlus,
  faSpinner,
  faWandSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { createTransaction, TransactionActionState } from "./actions";
import { TransactionCategory } from "./transaction-types";

export default function TransactionForm({
  categories,
  onSuccess,
}: {
  categories: TransactionCategory[];
  onSuccess: () => void;
}) {
  const [state, action, pending] = useActionState<
    TransactionActionState,
    FormData
  >(createTransaction, undefined);
  const [categoryId, setCategoryId] = useState("");
  const [categorizingLoading, setCategorizingLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [aiCategoryRaw, setAiCategoryRaw] = useState("");
  const [aiConfidenceScore, setAiConfidenceScore] = useState("");
  const descriptionRef = useRef<HTMLInputElement>(null);
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

  const handleAutoCategorize = async () => {
    const description = descriptionRef.current?.value.trim();
    if (!description) {
      setAiMessage("Add a description first.");
      return;
    }

    setCategorizingLoading(true);
    setAiMessage("");
    try {
      const response = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
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

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kathmandu",
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!categoryId) {
      setAiMessage("Please choose a category.");
      e.preventDefault();
    }
  };

  return (
    <form
      action={action}
      onSubmit={handleSubmit}
      className="space-y-5 rounded-lg bg-card p-4 "
    >
      {state?.message && (
        <div className="rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">
          {state.message}
        </div>
      )}
      <input
        type="hidden"
        name="isAiCategorized"
        value={aiCategoryRaw && categoryId ? "true" : ""}
      />
      <input type="hidden" name="aiCategoryRaw" value={aiCategoryRaw} />
      <input type="hidden" name="aiConfidenceScore" value={aiConfidenceScore} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="description">Description *</Label>
          <Input
            ref={descriptionRef}
            id="description"
            name="description"
            placeholder="e.g. Grocery shopping"
            required
            className="h-10"
          />
          {state?.errors?.description && (
            <p className="text-xs text-destructive">
              {state.errors.description[0]}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            required
            className="h-10"
          />
          {state?.errors?.amount && (
            <p className="text-xs text-destructive">{state.errors.amount[0]}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="type">Type *</Label>
          <Select name="type" defaultValue="EXPENSE" required>
            <SelectTrigger id="type" className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EXPENSE">Expense</SelectItem>
              <SelectItem value="INCOME">Income</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={today}
            required
            className="h-10"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
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
              <SelectTrigger id="category" className=" py-4 h-auto w-full">
                <SelectValue
                  placeholder="Select a category"
                  className="h-auto"
                />
              </SelectTrigger>
              <SelectContent className="min-w-64 ">
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={handleAutoCategorize}
              disabled={categorizingLoading}
              className=" shrink-0 gap-2 px-3"
              title="Auto-categorize using AI"
            >
              {categorizingLoading ? (
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="h-4 w-4 animate-spin"
                />
              ) : (
                <FontAwesomeIcon icon={faWandSparkles} className="w-2 h-2" />
              )}
            </Button>
          </div>
          {aiMessage && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FontAwesomeIcon icon={faCircleInfo} className="h-3.5 w-3.5" />
              {aiMessage}
            </p>
          )}
          {state?.errors?.categoryId && (
            <p className="text-xs text-destructive">
              {state.errors.categoryId[0]}
            </p>
          )}
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Optional notes..."
            rows={3}
            className="resize-none"
          />
        </div>
      </div>
      <div className="flex justify-end border-t pt-4">
        <Button type="submit" disabled={pending} className="h-10 gap-2">
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
    </form>
  );
}
