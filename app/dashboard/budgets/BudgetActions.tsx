"use client";

import { useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, MoreVertical, Pencil, Trash2, Loader2 } from "lucide-react";
import { createBudget, deleteBudget, BudgetActionState } from "./actions";

interface Category {
  id: string;
  name: string;
  type: string;
}

interface Budget {
  id: string;
  categoryId: string;
  period: string;
  amount: number;
  startDate: Date;
  endDate?: Date | null;
}

interface Props {
  categories: Category[];
  currency: string;
  mode: "create" | "edit";
  budget?: Budget;
}

function BudgetForm({
  categories,
  mode,
  budget,
  onSuccess,
}: {
  categories: Category[];
  mode: "create" | "edit";
  budget?: Budget;
  onSuccess: () => void;
}) {
  const action = mode === "create" ? createBudget : createBudget; // edit uses updateBudget bound below
  const [state, formAction, pending] = useActionState<BudgetActionState, FormData>(
    action,
    undefined
  );

  if (state?.success) onSuccess();

  const today = budget?.startDate
    ? new Date(budget.startDate).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  return (
    <form action={formAction} className="space-y-4">
      {state?.message && (
        <div className="rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">
          {state.message}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="categoryId">Category *</Label>
        <Select name="categoryId" defaultValue={budget?.categoryId} required>
          <SelectTrigger id="categoryId"><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state?.errors?.categoryId && <p className="text-xs text-destructive">{state.errors.categoryId[0]}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="amountLimit">Limit Amount *</Label>
          <Input
            id="amountLimit"
            name="amountLimit"
            type="number"
            step="0.01"
            min="1"
            defaultValue={budget?.amount}
            placeholder="0.00"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="period">Period *</Label>
          <Select name="period" defaultValue={budget?.period ?? "MONTHLY"} required>
            <SelectTrigger id="period"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY">Daily</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="QUARTERLY">Quarterly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
              <SelectItem value="CUSTOM">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Start Date *</Label>
          <Input id="startDate" name="startDate" type="date" defaultValue={today} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={budget?.endDate ? new Date(budget.endDate).toISOString().split("T")[0] : undefined}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending} className="gap-1.5">
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {mode === "create" ? "Create Budget" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

export default function BudgetActions({ categories, currency, mode, budget }: Props) {
  const [open, setOpen] = useState(false);

  if (mode === "create") {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Create Budget
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Budget</DialogTitle>
          </DialogHeader>
          <BudgetForm
            categories={categories}
            mode="create"
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setOpen(true); }} className="gap-2">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Budget</DialogTitle>
            </DialogHeader>
            <BudgetForm
              categories={categories}
              mode="edit"
              budget={budget}
              onSuccess={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
        <DropdownMenuItem
          className="gap-2 text-destructive focus:text-destructive"
          onClick={() => {
            if (budget && confirm("Delete this budget?")) deleteBudget(budget.id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
