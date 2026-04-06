"use client";

import { useState, useTransition, useActionState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUpDown,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createTransaction, deleteTransaction, TransactionActionState } from "./actions";

interface Transaction {
  id: string;
  description: string | null;
  amount: number;
  type: "INCOME" | "EXPENSE";
  date: Date;
  notes: string | null;
  categoryId: string | null;
  isAiCategorized: boolean;
  aiConfidenceScore: number | null;
  category: { id: string; name: string; color: string | null; icon: string | null } | null;
}

interface Category {
  id: string;
  name: string;
  type: string;
  color: string | null;
  icon: string | null;
}

interface Props {
  transactions: Transaction[];
  categories: Category[];
  currency: string;
  total: number;
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

function formatCurrency(amount: number, currency = "NPR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function TransactionForm({
  categories,
  onSuccess,
}: {
  categories: Category[];
  onSuccess: () => void;
}) {
  const [state, action, pending] = useActionState<TransactionActionState, FormData>(
    createTransaction,
    undefined
  );

  if (state?.success) {
    onSuccess();
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <form action={action} className="space-y-4">
      {state?.message && (
        <div className="rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">
          {state.message}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="description">Description *</Label>
          <Input id="description" name="description" placeholder="e.g. Grocery shopping" required />
          {state?.errors?.description && <p className="text-xs text-destructive">{state.errors.description[0]}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount *</Label>
          <Input id="amount" name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" required />
          {state?.errors?.amount && <p className="text-xs text-destructive">{state.errors.amount[0]}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="type">Type *</Label>
          <Select name="type" defaultValue="EXPENSE" required>
            <SelectTrigger id="type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="EXPENSE">Expense</SelectItem>
              <SelectItem value="INCOME">Income</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date">Date *</Label>
          <Input id="date" name="date" type="date" defaultValue={today} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="categoryId">Category</Label>
          <Select name="categoryId">
            <SelectTrigger id="categoryId"><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" placeholder="Optional notes..." rows={2} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending} className="gap-1.5">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Add Transaction
        </Button>
      </div>
    </form>
  );
}

export default function TransactionTable({
  transactions,
  categories,
  currency,
  total,
  page,
  totalPages,
  searchParams,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(
      Object.entries(searchParams).filter(([, v]) => v != null) as [string, string][]
    );
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    startTransition(() => deleteTransaction(id));
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            defaultValue={searchParams.keyword}
            onChange={(e) => {
              setTimeout(() => updateParam("keyword", e.target.value || null), 300);
            }}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select
          value={searchParams.type ?? "ALL"}
          onValueChange={(v) => updateParam("type", v === "ALL" ? null : v)}
        >
          <SelectTrigger className="w-32 h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="INCOME">Income</SelectItem>
            <SelectItem value="EXPENSE">Expense</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={searchParams.category ?? "ALL"}
          onValueChange={(v) => updateParam("category", v === "ALL" ? null : v)}
        >
          <SelectTrigger className="w-40 h-8 text-sm"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          placeholder="From"
          defaultValue={searchParams.dateFrom}
          onChange={(e) => updateParam("dateFrom", e.target.value || null)}
          className="w-36 h-8 text-sm"
        />
        <Input
          type="date"
          placeholder="To"
          defaultValue={searchParams.dateTo}
          onChange={(e) => updateParam("dateTo", e.target.value || null)}
          className="w-36 h-8 text-sm"
        />
        {Object.values(searchParams).some(Boolean) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(pathname)}
            className="h-8 gap-1 text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
        <div className="ml-auto">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Transaction</DialogTitle>
              </DialogHeader>
              <TransactionForm
                categories={categories}
                onSuccess={() => setAddOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-10 px-3 py-2.5 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-border"
                    onChange={(e) => {
                      if (e.target.checked) setSelected(new Set(transactions.map((t) => t.id)));
                      else setSelected(new Set());
                    }}
                    checked={selected.size === transactions.length && transactions.length > 0}
                  />
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Description</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Amount</th>
                <th className="px-3 py-2.5 text-center font-medium text-muted-foreground w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-12 text-center text-muted-foreground">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className={cn(
                      "border-b last:border-b-0 hover:bg-muted/30 transition-colors",
                      selected.has(tx.id) && "bg-primary/5"
                    )}
                  >
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        className="rounded border-border"
                        checked={selected.has(tx.id)}
                        onChange={() => toggleSelect(tx.id)}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-3 py-2.5 max-w-48">
                      <p className="truncate font-medium">{tx.description ?? "—"}</p>
                      {tx.isAiCategorized && tx.aiConfidenceScore !== null && tx.aiConfidenceScore < 0.85 && (
                        <span className="text-[10px] text-amber-500">⚠ AI: {Math.round(tx.aiConfidenceScore * 100)}%</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {tx.category ? (
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-5 px-2"
                          style={{
                            backgroundColor: `${tx.category.color ?? "#6B7280"}20`,
                            color: tx.category.color ?? "#6B7280",
                          }}
                        >
                          {tx.category.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold whitespace-nowrap">
                      <span className={tx.type === "INCOME" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                        {tx.type === "INCOME" ? "+" : "-"}{formatCurrency(tx.amount, currency)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(tx.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages} ({total} records)
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => updateParam("page", String(page - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => updateParam("page", String(page + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
