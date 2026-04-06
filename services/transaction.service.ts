import { prisma } from "@/prisma";
import { TransactionType } from "@/generated/prisma/client";

export interface TransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  amountMin?: number;
  amountMax?: number;
  keyword?: string;
  type?: TransactionType;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function getUserTransactions(
  userId: string,
  filters: TransactionFilters = {}
) {
  const {
    dateFrom,
    dateTo,
    category,
    amountMin,
    amountMax,
    keyword,
    type,
    page = 1,
    pageSize = 20,
    sortBy = "date",
    sortOrder = "desc",
  } = filters;

  const where: Record<string, unknown> = {
    userId,
    isDeleted: false,
    ...(dateFrom || dateTo
      ? {
          date: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
      : {}),
    ...(category ? { category: { name: category } } : {}),
    ...(amountMin !== undefined || amountMax !== undefined
      ? {
          amount: {
            ...(amountMin !== undefined ? { gte: amountMin } : {}),
            ...(amountMax !== undefined ? { lte: amountMax } : {}),
          },
        }
      : {}),
    ...(keyword
      ? { description: { contains: keyword, mode: "insensitive" } }
      : {}),
    ...(type ? { type } : {}),
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        category: true,
        paymentMethod: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, total, page, pageSize };
}

export async function createTransaction(data: {
  userId: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: Date;
  categoryId?: string;
  paymentMethodId?: string;
  notes?: string;
  isAiCategorized?: boolean;
  aiCategoryRaw?: string;
  aiConfidenceScore?: number;
}) {
  const transaction = await prisma.transaction.create({
    data: {
      ...data,
      amount: data.amount,
    },
    include: { category: true },
  });
  return transaction;
}

export async function updateTransaction(
  id: string,
  userId: string,
  data: Partial<{
    description: string;
    amount: number;
    type: TransactionType;
    date: Date;
    categoryId: string | null;
    paymentMethodId: string | null;
    notes: string;
    isAiCategorized: boolean;
    aiCategoryRaw: string;
    aiConfidenceScore: number;
  }>
) {
  const transaction = await prisma.transaction.update({
    where: { id, userId },
    data,
    include: { category: true },
  });
  return transaction;
}

export async function deleteTransaction(id: string, userId: string) {
  await prisma.transaction.update({
    where: { id, userId },
    data: { isDeleted: true, deletedAt: new Date() },
  });
}

export async function bulkDeleteTransactions(ids: string[], userId: string) {
  await prisma.transaction.updateMany({
    where: { id: { in: ids }, userId },
    data: { isDeleted: true, deletedAt: new Date() },
  });
}

export async function getRecentTransactions(userId: string, limit = 5) {
  return prisma.transaction.findMany({
    where: { userId, isDeleted: false },
    include: { category: true },
    orderBy: { date: "desc" },
    take: limit,
  });
}
