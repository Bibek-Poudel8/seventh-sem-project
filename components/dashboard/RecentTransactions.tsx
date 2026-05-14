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
          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-muted/50">
                  <th className="pb-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Transaction</th>
                  <th className="pb-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                  <th className="pb-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Date</th>
                  <th className="pb-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/30">
                {recentTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="group hover:bg-muted/30 transition-all duration-200"
                  >
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">

                        <p className="text-sm font-medium truncate max-w-[140px] md:max-w-[200px]">
                          {tx.description ?? "Unnamed"}
                        </p>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-5 px-2 bg-primary/5 text-primary border-none font-medium"
                      >
                        {tx.category?.name ?? "Uncategorized"}
                      </Badge>
                    </td>
                    <td className="py-3.5 text-right whitespace-nowrap">
                      <span className="text-xs text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="py-3.5 text-right whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span
                          className={cn(
                            "text-sm font-bold",
                            tx.type === "INCOME"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-foreground"
                          )}
                        >
                          {tx.type === "INCOME" ? "+" : "-"}
                          {formatCurrency(Number(tx.amount), currency)}
                        </span>
                        {tx.isAiCategorized &&
                          tx.aiConfidenceScore !== null &&
                          tx.aiConfidenceScore! < 0.8 && (
                            <span className="text-[9px] text-amber-500 font-medium">
                              AI: {Math.round(tx.aiConfidenceScore! * 100)}%
                            </span>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
