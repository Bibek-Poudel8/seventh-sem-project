import { redirect } from "next/navigation";
import { auth } from "@/auth";
import * as analyticsService from "@/services/analytics.service";
import * as budgetService from "@/services/budget.service";
import { prisma } from "@/prisma";
import SummaryCards from "@/components/dashboard/SummaryCards";
import ChartsRow from "@/components/dashboard/ChartsRow";
import BudgetsAndAI from "@/components/dashboard/BudgetsAndAI";
import RecentTransactions from "@/components/dashboard/RecentTransactions";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const userId = session.user.id;
  const now = new Date();

  // Parallel server-side fetches
  const [
    summary,
    categoryBreakdown,
    monthlyTrend,
    recentTransactions,
    budgets,
    profile,
  ] = await Promise.all([
    analyticsService.getMonthlySummary(userId, now),
    analyticsService.getCategoryBreakdown(userId, now),
    analyticsService.getMonthlyTrend(userId, 6),
    analyticsService.getRecentTransactions(userId, 5),
    budgetService.getUserBudgets(userId),
    prisma.userProfile.findUnique({ where: { userId } }),
  ]);

  const currency = profile?.currency ?? "NPR";
  const activeBudgets = budgets.slice(0, 4);

  return (
    <div className="space-y-6">
      <SummaryCards
        summary={summary}
        currency={currency}
        monthlyTrend={monthlyTrend}
      />

      <ChartsRow
        categoryBreakdown={categoryBreakdown}
        monthlyTrend={monthlyTrend}
        currency={currency}
      />

      <BudgetsAndAI activeBudgets={activeBudgets} currency={currency} />

      <RecentTransactions
        recentTransactions={recentTransactions}
        currency={currency}
      />
    </div>
  );
}
