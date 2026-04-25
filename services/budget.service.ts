import { prisma } from "@/prisma";
import { BudgetPeriod } from "@/generated/prisma/client";

export async function getUserBudgets(userId: string) {
  const budgets = await prisma.budget.findMany({
    where: { userId, isActive: true },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  // For each budget, calculate how much has been spent in this period
  const budgetsWithSpend = await Promise.all(
    budgets.map(async (budget) => {
      const spent = await getBudgetSpend(budget.id, userId, budget.startDate, budget.endDate);
      const limit = Number(budget.amountLimit);
      return {
        ...budget,
        spent,
        remaining: limit - spent,
        percentUsed: limit > 0 ? Math.round((spent / limit) * 100) : 0,
      };
    })
  );

  return budgetsWithSpend;
}

export async function getBudgetSpend(
  budgetId: string,
  userId: string,
  startDate: Date,
  endDate: Date | null
) {
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: { category: true },
  });
  if (!budget) return 0;

  const result = await prisma.transaction.aggregate({
    where: {
      userId,
      categoryId: budget.categoryId,
      type: "EXPENSE",
      isDeleted: false,
      date: {
        gte: startDate,
        ...(endDate ? { lte: endDate } : {}),
      },
    },
    _sum: { amount: true },
  });

  return Number(result._sum.amount ?? 0);
}

export async function createBudget(data: {
  userId: string;
  categoryId: string;
  period: BudgetPeriod;
  amountLimit: number;
  startDate: Date;
  endDate?: Date;
  notifyAt?: number;
}) {
  const budget = await prisma.budget.create({
    data: {
      userId: data.userId,
      categoryId: data.categoryId,
      period: data.period,
      amountLimit: data.amountLimit,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      isActive: true,
    },
    include: { category: true },
  });
  return budget;
}

export async function updateBudget(
  id: string,
  userId: string,
  data: Partial<{
    categoryId: string;
    period: BudgetPeriod;
    amountLimit: number;
    startDate: Date;
    endDate: Date | null;
    isActive: boolean;
  }>
) {
  return prisma.budget.update({
    where: { id, userId },
    data,
    include: { category: true },
  });
}

export async function deleteBudget(id: string, userId: string) {
  await prisma.budget.update({
    where: { id, userId },
    data: { isActive: false },
  });
}

export async function getAllUserBudgets(userId: string) {
  return prisma.budget.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
}
