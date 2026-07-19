import { prisma } from "@/prisma";
import { getCategoryColor } from "@/lib/category-colors";

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
  const prevNet = prevIncome - prevExpenses;
  const savingsRate = totalIncome > 0 ? ((netBalance / totalIncome) * 100) : 0;

  // Deltas: return 100 or -100 for zero-to-non-zero transitions so UI can show a percentage
  const incomeDelta = prevIncome === 0 
    ? (totalIncome === 0 ? 0 : 100)
    : Math.round(((totalIncome - prevIncome) / Math.abs(prevIncome)) * 100);

  const expenseDelta = prevExpenses === 0
    ? (totalExpenses === 0 ? 0 : 100)
    : Math.round(((totalExpenses - prevExpenses) / Math.abs(prevExpenses)) * 100);

  const netDelta = prevNet === 0
    ? (netBalance === 0 ? 0 : (netBalance > 0 ? 100 : -100))
    : Math.round(((netBalance - prevNet) / Math.abs(prevNet)) * 100);

  return {
    totalIncome,
    totalExpenses,
    netBalance,
    savingsRate: Math.round(savingsRate * 10) / 10,
    // Legacy fields kept non-null for SummaryCards backward compat
    incomeDelta: incomeDelta ?? 0,
    expenseDelta: expenseDelta ?? 0,
    // Nullable deltas for Monthly Summary — null = "no prior data"
    incomeDeltaNullable: incomeDelta,
    expenseDeltaNullable: expenseDelta,
    netDeltaNullable: netDelta,
    prevIncome,
    prevExpenses,
    prevNet,
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
    const key = tx.category?.name?.toLowerCase().trim() ?? "uncategorized";
    const category = tx.category?.name ?? "Uncategorized";
    const color = getCategoryColor(tx.category?.name, tx.category?.color);
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
