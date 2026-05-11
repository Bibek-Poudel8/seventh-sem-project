import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import DeltaBadge from "@/components/dashboard/DeltaBadge";
import { formatCurrency } from "@/components/dashboard/utils";
import Sparkline from "@/components/charts/Sparkline";

type TrendItem = {
  month: string;
  income: number;
  expenses: number;
  net: number;
};

export default function SummaryCards({
  summary,
  currency,
  monthlyTrend = [],
}: {
  summary: any;
  currency: string;
  monthlyTrend?: TrendItem[];
}) {
  const incomeSeries = (monthlyTrend ?? []).map((m) => m.income);
  const expenseSeries = (monthlyTrend ?? []).map((m) => m.expenses);
  const netSeries = (monthlyTrend ?? []).map((m) => m.net);

  const netDelta = (() => {
    if (netSeries.length < 2) return 0;
    const last = netSeries[netSeries.length - 1];
    const prev = netSeries[netSeries.length - 2] || 0;
    return prev > 0 ? Math.round(((last - prev) / prev) * 100) : 0;
  })();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Net */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground uppercase font-semibold">
              Net Balance
            </div>
            <div
              className={cn(
                "text-2xl font-bold mt-1",
                summary.netBalance >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400",
              )}
            >
              {formatCurrency(summary.netBalance, currency)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2">
              <DeltaBadge delta={netDelta} />
              <span>last month</span>
            </div>
          </div>
          <div className="w-28 h-12">
            <Sparkline
              data={netSeries}
              stroke={summary.netBalance >= 0 ? "#16a34a" : "#ef4444"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Income */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground uppercase font-semibold">
              Income
            </div>
            <div className="text-2xl font-bold mt-1">
              {formatCurrency(summary.totalIncome, currency)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2">
              <DeltaBadge delta={summary.incomeDelta} />
              <span>last month</span>
            </div>
          </div>
          <div className="w-28 h-12">
            <Sparkline data={incomeSeries} stroke="#10b981" />
          </div>
        </CardContent>
      </Card>

      {/* Expenses */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground uppercase font-semibold">
              Expenses
            </div>
            <div className="text-2xl font-bold mt-1">
              {formatCurrency(summary.totalExpenses, currency)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2">
              <DeltaBadge delta={summary.expenseDelta} />
              <span>last month</span>
            </div>
          </div>
          <div className="w-28 h-12">
            <Sparkline data={expenseSeries} stroke="#ef4444" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
