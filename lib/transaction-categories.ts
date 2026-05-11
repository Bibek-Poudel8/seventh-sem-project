import { TransactionType } from "../generated/prisma/client";

export const SYSTEM_TRANSACTION_CATEGORIES = [
  {
    name: "Food & Dining",
    type: TransactionType.EXPENSE,
    icon: "utensils",
    color: "#16A34A",
  },
  {
    name: "Shopping & Retail",
    type: TransactionType.EXPENSE,
    icon: "shopping-bag",
    color: "#DB2777",
  },
  {
    name: "Transportation",
    type: TransactionType.EXPENSE,
    icon: "car",
    color: "#2563EB",
  },
  {
    name: "Healthcare & Medical",
    type: TransactionType.EXPENSE,
    icon: "heart-pulse",
    color: "#DC2626",
  },
  {
    name: "Utilities & Bills",
    type: TransactionType.EXPENSE,
    icon: "receipt",
    color: "#CA8A04",
  },
  {
    name: "Entertainment & Recreation",
    type: TransactionType.EXPENSE,
    icon: "ticket",
    color: "#7C3AED",
  },
  {
    name: "Financial Services",
    type: TransactionType.EXPENSE,
    icon: "landmark",
    color: "#0891B2",
  },
  {
    name: "Government & Legal",
    type: TransactionType.EXPENSE,
    icon: "scale",
    color: "#4B5563",
  },
  {
    name: "Charity & Donations",
    type: TransactionType.EXPENSE,
    icon: "hand-heart",
    color: "#EA580C",
  },
  {
    name: "Income",
    type: TransactionType.INCOME,
    icon: "wallet",
    color: "#059669",
  },
  {
    name: "Miscellaneous",
    type: TransactionType.EXPENSE,
    icon: "circle-help",
    color: "#64748B",
  },
] as const;

export function normalizeCategoryName(category: string) {
  const trimmed = category.trim();
  return (
    SYSTEM_TRANSACTION_CATEGORIES.find(
      (item) => item.name.toLowerCase() === trimmed.toLowerCase(),
    )?.name ?? trimmed
  );
}
