import { redirect } from "next/navigation";
import { auth } from "@/auth";
import * as analyticsService from "@/services/analytics.service";
import * as budgetService from "@/services/budget.service";
import { prisma } from "@/prisma";
import SummaryCards from "@/components/dashboard/SummaryCards";
import ChartsRow from "@/components/dashboard/ChartsRow";
import BudgetsAndAI from "@/components/dashboard/BudgetsAndAI";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import DateRangePicker from "@/components/dashboard/DateRangePicker";

function getDateRange(range: string, from?: string, to?: string) {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  switch (range) {
    case "today":
      start = new Date(now.setHours(0, 0, 0, 0));
      end = new Date(now.setHours(23, 59, 59, 999));
      break;
    case "yesterday": {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      start = new Date(d.setHours(0, 0, 0, 0));
      end = new Date(d.setHours(23, 59, 59, 999));
      break;
    }
    case "last7days": {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      start = new Date(d.setHours(0, 0, 0, 0));
      end = new Date();
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "last30days": {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      start = new Date(d.setHours(0, 0, 0, 0));
      end = new Date();
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "thisMonth":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case "lastMonth":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case "thisYear":
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    case "lastYear":
      start = new Date(now.getFullYear() - 1, 0, 1);
      end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      break;
    case "custom":
      if (from && to) {
        start = new Date(from);
        end = new Date(to);
        end.setHours(23, 59, 59, 999);
      }
      break;
    default: // thisMonth
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }
  return { start, end };
}

export default async function DashboardPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const searchParams = await props.searchParams;
  const userId = session.user.id;
  const range = (searchParams.range as string) || "thisMonth";
  const from = searchParams.from as string;
  const to = searchParams.to as string;

  const { start, end } = getDateRange(range, from, to);

  // Parallel server-side fetches
  const [
    summary,
    categoryBreakdown,
    monthlyTrend,
    recentTransactions,
    budgets,
    profile,
  ] = await Promise.all([
    analyticsService.getPeriodSummary(userId, start, end),
    analyticsService.getCategoryBreakdown(userId, start, end),
    analyticsService.getMonthlyTrend(userId, 6),
    analyticsService.getRecentTransactions(userId, 5, start, end),
    budgetService.getUserBudgets(userId),
    prisma.userProfile.findUnique({ where: { userId } }),
  ]);

  const currency = profile?.currency ?? "NPR";
  const activeBudgets = budgets.slice(0, 4);

  const periodLabels: { [key: string]: string } = {
    today: "day",
    yesterday: "day",
    last7days: "7 days",
    last30days: "30 days",
    thisMonth: "month",
    lastMonth: "month",
    thisYear: "year",
    lastYear: "year",
    custom: "period",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Monitor your financial health and spending patterns.
          </p>
        </div>
        <DateRangePicker />
      </div>

      <SummaryCards
        summary={summary}
        currency={currency}
        monthlyTrend={monthlyTrend}
        periodLabel={periodLabels[range] || "month"}
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
