"use client";

import { useActionState, useEffect, useState } from "react";
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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEllipsisVertical,
  faPencil,
  faTrashCan,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import {
  createBudget,
  deleteBudget,
  updateBudget,
  BudgetActionState,
} from "./actions";

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

type BudgetPeriod =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "YEARLY"
  | "CUSTOM";

interface Props {
  categories: Category[];
  mode: "create" | "edit";
  budget?: Budget;
  defaultCategoryId?: string;
  defaultPeriod?: BudgetPeriod;
  defaultStartDate?: string;
  defaultEndDate?: string;
  triggerLabel?: string;
  dialogTitle?: string;
}

function BudgetForm({
  categories,
  mode,
  budget,
  defaultCategoryId,
  defaultPeriod = "MONTHLY",
  defaultStartDate,
  defaultEndDate,
  onSuccess,
}: {
  categories: Category[];
  mode: "create" | "edit";
  budget?: Budget;
  defaultCategoryId?: string;
  defaultPeriod?: BudgetPeriod;
  defaultStartDate?: string;
  defaultEndDate?: string;
  onSuccess: () => void;
}) {
  const action =
    mode === "create" && !budget
      ? createBudget
      : updateBudget.bind(null, budget?.id ?? "");
  const [state, formAction, pending] = useActionState<
    BudgetActionState,
    FormData
  >(action, undefined);

  useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
  }, [onSuccess, state?.success]);

  const today = new Date().toISOString().split("T")[0];
  const categoryValue = budget?.categoryId ?? defaultCategoryId ?? "";
  const periodValue = (budget?.period ?? defaultPeriod) as BudgetPeriod;
  const startDateValue = budget?.startDate
    ? new Date(budget.startDate).toISOString().split("T")[0]
    : (defaultStartDate ?? today);
  const endDateValue = budget?.endDate
    ? new Date(budget.endDate).toISOString().split("T")[0]
    : defaultEndDate;

  return (
    <form action={formAction} className="space-y-4">
      {state?.message && (
        <div className="rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">
          {state.message}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="categoryId">Category *</Label>
        <Select name="categoryId" defaultValue={categoryValue} required>
          <SelectTrigger id="categoryId">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state?.errors?.categoryId && (
          <p className="text-xs text-destructive">
            {state.errors.categoryId[0]}
          </p>
        )}
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
          <Select name="period" defaultValue={periodValue} required>
            <SelectTrigger id="period">
              <SelectValue />
            </SelectTrigger>
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
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={startDateValue}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={endDateValue}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending} className="gap-1.5">
          {pending && (
            <FontAwesomeIcon
              icon={faSpinner}
              className="h-3.5 w-3.5 animate-spin"
            />
          )}
          {mode === "create" ? "Create Budget" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

export default function BudgetActions({
  categories,
  mode,
  budget,
  defaultCategoryId,
  defaultPeriod = "MONTHLY",
  defaultStartDate,
  defaultEndDate,
  triggerLabel = "Create Budget",
  dialogTitle,
}: Props) {
  const [open, setOpen] = useState(false);

  const resolvedDialogTitle =
    dialogTitle ?? (mode === "create" ? "Create Budget" : "Edit Budget");

  if (mode === "create") {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="gap-1.5">
            <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />{" "}
            {triggerLabel}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{resolvedDialogTitle}</DialogTitle>
          </DialogHeader>
          <BudgetForm
            categories={categories}
            mode="create"
            defaultCategoryId={defaultCategoryId}
            defaultPeriod={defaultPeriod}
            defaultStartDate={defaultStartDate}
            defaultEndDate={defaultEndDate}
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
          <FontAwesomeIcon icon={faEllipsisVertical} className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setOpen(true);
              }}
              className="gap-2"
            >
              <FontAwesomeIcon icon={faPencil} className="h-3.5 w-3.5" /> Edit
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{resolvedDialogTitle}</DialogTitle>
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
            if (budget && confirm("Delete this budget?"))
              deleteBudget(budget.id);
          }}
        >
          <FontAwesomeIcon icon={faTrashCan} className="h-3.5 w-3.5" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
