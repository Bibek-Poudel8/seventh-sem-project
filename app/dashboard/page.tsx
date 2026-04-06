import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DonutChart } from "@/components/charts/DonutChart";
import { BarLineChart } from "@/components/charts/BarLineChart";
import * as analyticsService from "@/services/analytics.service";
import * as budgetService from "@/services/budget.service";
import { prisma } from "@/prisma";
import { cn } from "@/lib/utils";

function formatCurrency(amount: number, currency = "NPR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) return null;
  return (
    <span
      className={cn(
        "flex items-center gap-0.5 text-xs font-medium",
        delta > 0 ? "text-emerald-500" : "text-red-500"
      )}
    >
      {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(delta)}% from last month
    </span>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const userId = session.user.id;
  const now = new Date();

  // Parallel server-side fetches
  const [summary, categoryBreakdown, monthlyTrend, recentTransactions, budgets, profile] =
    await Promise.all([
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
      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Balance */}
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground font-medium">Net Balance</span>
              <div className={cn("p-1.5 rounded-lg", summary.netBalance >= 0 ? "bg-emerald-500/10" : "bg-red-500/10")}>
                <Wallet className={cn("h-4 w-4", summary.netBalance >= 0 ? "text-emerald-500" : "text-red-500")} />
              </div>
            </div>
            <p className={cn("text-2xl font-bold", summary.netBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
              {formatCurrency(summary.netBalance, currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        {/* Total Income */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground font-medium">Income</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalIncome, currency)}</p>
            <DeltaBadge delta={summary.incomeDelta} />
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground font-medium">Expenses</span>
              <div className="p-1.5 rounded-lg bg-red-500/10">
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalExpenses, currency)}</p>
            <DeltaBadge delta={summary.expenseDelta} />
          </CardContent>
        </Card>

        {/* Savings Rate */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground font-medium">Savings Rate</span>
              <div className="p-1.5 rounded-lg bg-violet-500/10">
                <PiggyBank className="h-4 w-4 text-violet-500" />
              </div>
            </div>
            <p className={cn("text-2xl font-bold", summary.savingsRate >= 30 ? "text-emerald-600 dark:text-emerald-400" : summary.savingsRate >= 15 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400")}>
              {summary.savingsRate}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">of income saved</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={categoryBreakdown} currency={currency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <BarLineChart data={monthlyTrend} currency={currency} />
          </CardContent>
        </Card>
      </div>

      {/* ── Budget Progress + AI Insight ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Budget Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Budget Progress</CardTitle>
            <Link href="/dashboard/budgets" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeBudgets.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No active budgets.{" "}
                <Link href="/dashboard/budgets" className="text-primary hover:underline">
                  Create one
                </Link>
              </div>
            ) : (
              activeBudgets.map((budget) => {
                const pct = budget.percentUsed;
                const color = pct >= 100 ? "bg-red-500" : pct >= 90 ? "bg-orange-500" : pct >= 75 ? "bg-amber-500" : "bg-emerald-500";
                return (
                  <div key={budget.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">{budget.category.name}</span>
                      <div className="flex items-center gap-2">
                        {pct >= 100 && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(budget.spent, currency)} / {formatCurrency(Number(budget.amountLimit), currency)}
                        </span>
                      </div>
                    </div>
                    <Progress value={Math.min(pct, 100)} className="h-2" indicatorClassName={color} />
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">{pct}% used</span>
                      <span className={cn("text-[10px]", budget.remaining < 0 ? "text-red-500 font-medium" : "text-muted-foreground")}>
                        {budget.remaining < 0 ? `${formatCurrency(Math.abs(budget.remaining), currency)} over` : `${formatCurrency(budget.remaining, currency)} remaining`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* AI Insight Panel */}
        <Card className="bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-purple-500/5 border-indigo-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
              <div className="h-10 w-10 rounded-full bg-indigo-500/15 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-medium">AI insights unavailable</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The prediction engine is not yet connected.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Transactions ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold">Recent Transactions</CardTitle>
          <Link href="/dashboard/transactions" className="text-xs text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No transactions yet.{" "}
              <Link href="/dashboard/transactions" className="text-primary hover:underline">
                Add your first one
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
                    style={{
                      backgroundColor: `${tx.category?.color ?? "#6B7280"}20`,
                      color: tx.category?.color ?? "#6B7280",
                    }}
                  >
                    {(tx.category?.icon ?? "💰")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description ?? "Unnamed"}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                        {tx.category?.name ?? "Uncategorized"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn("text-sm font-semibold", tx.type === "INCOME" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                      {tx.type === "INCOME" ? "+" : "-"}{formatCurrency(Number(tx.amount), currency)}
                    </p>
                    {tx.isAiCategorized && tx.aiConfidenceScore !== null && tx.aiConfidenceScore! < 0.8 && (
                      <span className="text-[10px] text-amber-500">⚠ AI: {Math.round(tx.aiConfidenceScore! * 100)}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
