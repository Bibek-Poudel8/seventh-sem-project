import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMonthlyTrend, getCategoryBreakdown, getPeriodSummary } from "@/services/analytics.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarLineChart } from "@/components/charts/BarLineChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { prisma } from "@/prisma";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const userId = session.user.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [trend, breakdown, summary, profile] = await Promise.all([
    getMonthlyTrend(userId, 12),
    getCategoryBreakdown(userId, startOfMonth, endOfMonth),
    getPeriodSummary(userId, startOfMonth, endOfMonth),
    prisma.userProfile.findUnique({ where: { userId } }),
  ]);

  const currency = profile?.currency ?? "NPR";
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">12-month financial overview</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Income", value: fmt(summary.totalIncome), color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Total Expenses", value: fmt(summary.totalExpenses), color: "text-red-600 dark:text-red-400" },
          { label: "Net Balance", value: fmt(summary.netBalance), color: summary.netBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">12-Month Income vs Expenses</CardTitle></CardHeader>
          <CardContent><BarLineChart data={trend} currency={currency} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Spending by Category (This Month)</CardTitle></CardHeader>
          <CardContent><DonutChart data={breakdown} currency={currency} /></CardContent>
        </Card>
      </div>
    </div>
  );
}
