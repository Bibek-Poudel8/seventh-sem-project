import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserBudgets, getAllUserBudgets } from "@/services/budget.service";
import { prisma } from "@/prisma";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTriangleExclamation, faArrowTrendUp } from "@fortawesome/free-solid-svg-icons";
import { CircularProgress } from "@/components/ui/CircularProgress";
import BudgetActions from "./BudgetActions";

function formatCurrency(amount: number, currency = "NPR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function BudgetsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const userId = session.user.id;
  const [budgets, categories, profile] = await Promise.all([
    getUserBudgets(userId),
    prisma.category.findMany({
      where: { OR: [{ userId }, { isSystem: true }], type: "EXPENSE" },
      orderBy: { name: "asc" },
    }),
    prisma.userProfile.findUnique({ where: { userId } }),
  ]);

  const currency = profile?.currency ?? "NPR";
  const totalBudgeted = budgets.reduce((s, b) => s + Number(b.amountLimit), 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            {budgets.length} active budget{budgets.length !== 1 ? "s" : ""}
          </p>
        </div>
        <BudgetActions categories={categories} currency={currency} mode="create" />
      </div>

      {/* Summary Bar */}
      {budgets.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Budgeted</p>
                <p className="text-lg font-bold">{formatCurrency(totalBudgeted, currency)}</p>
              </div>
              <div className="text-center border-x">
                <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totalSpent, currency)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                <p className={cn("text-lg font-bold", totalRemaining >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                  {formatCurrency(totalRemaining, currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Cards Grid */}
      {budgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <FontAwesomeIcon icon={faArrowTrendUp} className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-semibold">No budgets yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create a budget to start tracking your spending
              </p>
            </div>
            <BudgetActions categories={categories} currency={currency} mode="create" />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {budgets.map((budget) => {
            const pct = budget.percentUsed;
            return (
              <Card key={budget.id} className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        {budget.category.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                        {budget.period.toLowerCase()} budget
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {pct >= 100 && (
                        <Badge variant="destructive" className="text-[10px] h-5">Over</Badge>
                      )}
                      <BudgetActions
                        categories={categories}
                        currency={currency}
                        mode="edit"
                        budget={{ ...budget, amount: Number(budget.amountLimit) }}
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col items-center gap-4 pb-5">
                  <CircularProgress
                    percentage={pct}
                    size={130}
                    centerLabel={`${formatCurrency(budget.spent, currency)}`}
                    centerSubLabel={`of ${formatCurrency(Number(budget.amountLimit), currency)}`}
                  />

                  <div className="w-full text-center">
                    <p className={cn("text-sm font-semibold", budget.remaining < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground")}>
                      {budget.remaining < 0
                        ? `${formatCurrency(Math.abs(budget.remaining), currency)} over budget`
                        : `${formatCurrency(budget.remaining, currency)} remaining`}
                    </p>
                  </div>
                </CardContent>

                {/* Color accent bar */}
                <div
                  className={cn(
                    "absolute bottom-0 left-0 h-0.5 w-full transition-all",
                    pct >= 100 ? "bg-red-500" : pct >= 90 ? "bg-orange-500" : pct >= 75 ? "bg-amber-500" : "bg-emerald-500"
                  )}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
