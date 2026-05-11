export interface TransactionCategory {
  id: string;
  name: string;
  type: string;
  color: string | null;
  icon: string | null;
}

export interface TransactionItem {
  id: string;
  description: string | null;
  amount: number;
  type: "INCOME" | "EXPENSE";
  date: Date;
  notes: string | null;
  categoryId: string | null;
  isAiCategorized: boolean;
  aiConfidenceScore: number | null;
  category: TransactionCategory | null;
}

export function formatCurrency(amount: number, currency = "NPR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
