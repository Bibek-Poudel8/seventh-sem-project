import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faTriangleExclamation,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/components/dashboard/utils";
import AIAnomalyInsights from "@/components/dashboard/AIAnomalyInsights";

export default function BudgetsAndAI({
  activeBudgets,
  currency,
}: {
  activeBudgets: any[];
  currency: string;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold">
            Budget Progress
          </CardTitle>
          <Link
            href="/dashboard/budgets"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            View all <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeBudgets.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No active budgets.{" "}
              <Link
                href="/dashboard/budgets"
                className="text-primary hover:underline"
              >
                Create one
              </Link>
            </div>
          ) : (
            activeBudgets.map((budget) => {
              const pct = budget.percentUsed;
              const color =
                pct >= 100
                  ? "bg-red-500"
                  : pct >= 90
                    ? "bg-orange-500"
                    : pct >= 75
                      ? "bg-amber-500"
                      : "bg-emerald-500";
              return (
                <div key={budget.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">
                      {budget.category.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {pct >= 100 && (
                        <FontAwesomeIcon
                          icon={faTriangleExclamation}
                          className="h-3.5 w-3.5 text-red-500"
                        />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(budget.spent, currency)} /{" "}
                        {formatCurrency(Number(budget.amountLimit), currency)}
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={Math.min(pct, 100)}
                    className="h-2"
                    indicatorClassName={color}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">
                      {pct}% used
                    </span>
                    <span
                      className={cn(
                        "text-[10px]",
                        budget.remaining < 0
                          ? "text-red-500 font-medium"
                          : "text-muted-foreground",
                      )}
                    >
                      {budget.remaining < 0
                        ? `${formatCurrency(Math.abs(budget.remaining), currency)} over`
                        : `${formatCurrency(budget.remaining, currency)} remaining`}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card className="bg-linear-to-br from-indigo-500/10 via-violet-500/10 to-purple-500/5 border-indigo-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FontAwesomeIcon
              icon={faWandMagicSparkles}
              className="h-4 w-4 text-indigo-500"
            />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AIAnomalyInsights />
        </CardContent>
      </Card>
    </div>
  );
}
