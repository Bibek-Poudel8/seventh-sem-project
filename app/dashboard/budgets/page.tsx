import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAllUserBudgetsWithSpend } from "@/services/budget.service";
import { prisma } from "@/prisma";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendUp,
  faChevronDown,
  faCirclePlus,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
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

function formatDateInput(date: Date) {
  return date.toISOString().split("T")[0];
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function isSameMonth(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth()
  );
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function BudgetsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const userId = session.user.id;
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const [budgets, categories, profile] = await Promise.all([
    getAllUserBudgetsWithSpend(userId),
    prisma.category.findMany({
      where: { OR: [{ userId }, { isSystem: true }], type: "EXPENSE" },
      orderBy: { name: "asc" },
    }),
    prisma.userProfile.findUnique({ where: { userId } }),
  ]);

  const currency = profile?.currency ?? "NPR";
  const activeBudgets = budgets.filter((budget) => budget.isActive);
  const totalBudgeted = activeBudgets.reduce(
    (sum, budget) => sum + Number(budget.amountLimit),
    0,
  );
  const totalSpent = activeBudgets.reduce(
    (sum, budget) => sum + budget.spent,
    0,
  );
  const totalRemaining = totalBudgeted - totalSpent;

  const monthGroups = activeBudgets.reduce<
    Record<string, typeof activeBudgets>
  >((groups, budget) => {
    const key = formatMonthLabel(budget.startDate);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(budget);
    return groups;
  }, {});

  const monthGroupEntries = Object.entries(monthGroups).sort((left, right) => {
    const leftTime = left[1][0]?.startDate?.getTime() ?? 0;
    const rightTime = right[1][0]?.startDate?.getTime() ?? 0;
    return rightTime - leftTime;
  });

  return (
    <div className="space-y-6 ">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            {activeBudgets.length} active budget
            {activeBudgets.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <FontAwesomeIcon
                icon={faCirclePlus}
                className="h-4 w-4 text-primary"
              />
              Add Budget for This Month
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Create a budget scoped to {formatMonthLabel(currentMonthStart)}.
            </p>
            <BudgetActions
              categories={categories}
              mode="create"
              triggerLabel="Add this month"
              dialogTitle="Add Budget for This Month"
              defaultPeriod="MONTHLY"
              defaultStartDate={formatDateInput(currentMonthStart)}
              defaultEndDate={formatDateInput(currentMonthEnd)}
            />
          </CardContent>
        </Card>

        <details className="rounded-lg border bg-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
            <div>
              <p className="text-sm font-semibold">Month-wise budget</p>
              <p className="text-xs text-muted-foreground">
                Open to manage budgets for specific months and longer periods.
              </p>
            </div>
            <FontAwesomeIcon
              icon={faChevronDown}
              className="h-4 w-4 text-muted-foreground"
            />
          </summary>
          <div className="space-y-4 border-t px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Add month-wise budget</p>
                <p className="text-xs text-muted-foreground">
                  Set a budget for any month, quarter, year, or custom range.
                </p>
              </div>
              <BudgetActions
                categories={categories}
                mode="create"
                triggerLabel="Add month-wise budget"
                dialogTitle="Add Month-wise Budget"
              />
            </div>

            {monthGroupEntries.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No month-wise budgets yet.
              </div>
            ) : (
              <div className="space-y-3">
                {monthGroupEntries.map(([monthLabel, groupedBudgets]) => (
                  <Card key={monthLabel} className="border-muted/60">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">
                        {monthLabel}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {groupedBudgets.map((budget) => (
                        <div
                          key={budget.id}
                          className="flex items-center justify-between rounded-lg border px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {categories.find(
                                (category) => category.id === budget.categoryId,
                              )?.name ?? "Unknown category"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {budget.period.toLowerCase()} budget
                            </p>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            <p>
                              {formatCurrency(
                                Number(budget.amountLimit),
                                currency,
                              )}
                            </p>
                            <p>
                              {formatCurrency(budget.spent, currency)} spent
                            </p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </details>
      </div> */}

      {/* Summary Bar */}
      {activeBudgets.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  Total Budgeted
                </p>
                <p className="text-lg font-bold">
                  {formatCurrency(totalBudgeted, currency)}
                </p>
              </div>
              <div className="text-center border-x">
                <p className="text-xs text-muted-foreground mb-1">
                  Total Spent
                </p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totalSpent, currency)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                <p
                  className={cn(
                    "text-lg font-bold",
                    totalRemaining >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400",
                  )}
                >
                  {formatCurrency(totalRemaining, currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category-wise Budget Cards */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">Category Budgets</h2>
          <p className="text-sm text-muted-foreground">
            View and manage budgets for each expense category.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.map((category) => {
            const categoryBudgets = activeBudgets
              .filter((budget) => budget.categoryId === category.id)
              .sort(
                (left, right) =>
                  right.startDate.getTime() - left.startDate.getTime(),
              );
            const currentBudget =
              categoryBudgets.find((budget) =>
                isSameMonth(budget.startDate, currentMonthStart),
              ) ?? categoryBudgets[0];

            return (
              <Card key={category.id} className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        {category.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                        {currentBudget
                          ? `${currentBudget.period.toLowerCase()} budget`
                          : "No budget set"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {currentBudget && currentBudget.percentUsed >= 100 && (
                        <Badge
                          variant="destructive"
                          className="text-[10px] h-5"
                        >
                          Over
                        </Badge>
                      )}
                      {currentBudget && (
                        <BudgetActions
                          categories={categories}
                          mode="edit"
                          budget={{
                            ...currentBudget,
                            amount: Number(currentBudget.amountLimit),
                          }}
                        />
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col items-center gap-4 ">
                  {currentBudget ? (
                    <>
                      <CircularProgress
                        percentage={currentBudget.percentUsed}
                        size={130}
                        centerLabel={`${formatCurrency(currentBudget.spent, currency)}`}
                        centerSubLabel={`of ${formatCurrency(Number(currentBudget.amountLimit), currency)}`}
                      />

                      <div className="w-full text-center space-y-2">
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            currentBudget.remaining < 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-muted-foreground",
                          )}
                        >
                          {currentBudget.remaining < 0
                            ? `${formatCurrency(Math.abs(currentBudget.remaining), currency)} over budget`
                            : `${formatCurrency(currentBudget.remaining, currency)} remaining`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {categoryBudgets.length} budget
                          {categoryBudgets.length !== 1 ? "s" : ""} available
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex w-full flex-col items-center justify-center gap-4 py-4 text-center">
                      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                        <FontAwesomeIcon
                          icon={faArrowTrendUp}
                          className="h-7 w-7 text-muted-foreground"
                        />
                      </div>
                      <div>
                        <p className="font-semibold">Empty budget</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Add a budget for this category to begin tracking.
                        </p>
                      </div>
                      <BudgetActions
                        categories={categories}
                        mode="create"
                        triggerLabel="Add budget"
                        dialogTitle={`Add Budget for ${category.name}`}
                        defaultCategoryId={category.id}
                        defaultPeriod="MONTHLY"
                        defaultStartDate={formatDateInput(currentMonthStart)}
                        defaultEndDate={formatDateInput(currentMonthEnd)}
                      />
                    </div>
                  )}
                </CardContent>

                {/* Color accent bar */}
                <div
                  className={cn(
                    "absolute bottom-0 left-0 h-0.5 w-full transition-all",
                    currentBudget
                      ? currentBudget.percentUsed >= 100
                        ? "bg-red-500"
                        : currentBudget.percentUsed >= 90
                          ? "bg-orange-500"
                          : currentBudget.percentUsed >= 75
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      : "bg-muted",
                  )}
                  style={{
                    width: `${Math.min(currentBudget?.percentUsed ?? 0, 100)}%`,
                  }}
                />
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
