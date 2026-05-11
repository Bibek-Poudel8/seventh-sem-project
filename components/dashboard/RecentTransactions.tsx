import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faClock } from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/components/dashboard/utils";

export default function RecentTransactions({
  recentTransactions,
  currency,
}: {
  recentTransactions: any[];
  currency: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold">
          Recent Transactions
        </CardTitle>
        <Link
          href="/dashboard/transactions"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          View all <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {recentTransactions.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No transactions yet.{" "}
            <Link
              href="/dashboard/transactions"
              className="text-primary hover:underline"
            >
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
                  {tx.category?.icon ?? "💰"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {tx.description ?? "Unnamed"}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-4 px-1.5"
                    >
                      {tx.category?.name ?? "Uncategorized"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <FontAwesomeIcon icon={faClock} className="h-2.5 w-2.5" />
                      {new Date(tx.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      tx.type === "INCOME"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400",
                    )}
                  >
                    {tx.type === "INCOME" ? "+" : "-"}
                    {formatCurrency(Number(tx.amount), currency)}
                  </p>
                  {tx.isAiCategorized &&
                    tx.aiConfidenceScore !== null &&
                    tx.aiConfidenceScore! < 0.8 && (
                      <span className="text-[10px] text-amber-500">
                        ⚠ AI: {Math.round(tx.aiConfidenceScore! * 100)}%
                      </span>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
