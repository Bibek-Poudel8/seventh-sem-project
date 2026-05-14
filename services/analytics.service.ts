import { prisma } from "@/prisma";

export async function getPeriodSummary(userId: string, start: Date, end: Date) {
  // Calculate duration to determine previous period for comparison
  const duration = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - duration);

  const [incomeResult, expenseResult, prevIncomeResult, prevExpenseResult] =
    await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: "INCOME", isDeleted: false, date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: "EXPENSE", isDeleted: false, date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: "INCOME", isDeleted: false, date: { gte: prevStart, lte: prevEnd } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: "EXPENSE", isDeleted: false, date: { gte: prevStart, lte: prevEnd } },
        _sum: { amount: true },
      }),
    ]);

  const totalIncome = Number(incomeResult._sum.amount ?? 0);
  const totalExpenses = Number(expenseResult._sum.amount ?? 0);
  const prevIncome = Number(prevIncomeResult._sum.amount ?? 0);
  const prevExpenses = Number(prevExpenseResult._sum.amount ?? 0);
  const netBalance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((netBalance / totalIncome) * 100) : 0;

  const incomeDelta = prevIncome > 0
    ? Math.round(((totalIncome - prevIncome) / prevIncome) * 100)
    : 0;
  const expenseDelta = prevExpenses > 0
    ? Math.round(((totalExpenses - prevExpenses) / prevExpenses) * 100)
    : 0;

  return {
    totalIncome,
    totalExpenses,
    netBalance,
    savingsRate: Math.round(savingsRate * 10) / 10,
    incomeDelta,
    expenseDelta,
  };
}

export async function getCategoryBreakdown(userId: string, start: Date, end: Date) {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      isDeleted: false,
      date: { gte: start, lte: end },
    },
    include: { category: true },
  });

  const categoryMap = new Map<string, { category: string; amount: number; color: string; icon: string }>();

  for (const tx of transactions) {
    const key = tx.categoryId ?? "uncategorized";
    const category = tx.category?.name ?? "Uncategorized";
    const color = tx.category?.color ?? "#6B7280";
    const icon = tx.category?.icon ?? "circle";
    const existing = categoryMap.get(key);
    if (existing) {
      existing.amount += Number(tx.amount);
    } else {
      categoryMap.set(key, { category, amount: Number(tx.amount), color, icon });
    }
  }

  const total = Array.from(categoryMap.values()).reduce((s, c) => s + c.amount, 0);
  return Array.from(categoryMap.values())
    .sort((a, b) => b.amount - a.amount)
    .map((c) => ({ ...c, percentage: total > 0 ? Math.round((c.amount / total) * 100) : 0 }));
}

export async function getMonthlyTrend(userId: string, months = 6) {
  const results = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

    const [income, expenses] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: "INCOME", isDeleted: false, date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: "EXPENSE", isDeleted: false, date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
    ]);

    const inc = Number(income._sum.amount ?? 0);
    const exp = Number(expenses._sum.amount ?? 0);
    results.push({
      month: month.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      income: inc,
      expenses: exp,
      net: inc - exp,
    });
  }
  return results;
}

export async function getRecentTransactions(userId: string, limit = 5, start?: Date, end?: Date) {
  return prisma.transaction.findMany({
    where: { 
      userId, 
      isDeleted: false,
      ...(start && end ? { date: { gte: start, lte: end } } : {})
    },
    include: { category: true },
    orderBy: { date: "desc" },
    take: limit,
  });
}
