"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils";
import { formatCurrency, TransactionItem } from "./transaction-types";

type Props = {
  tx: TransactionItem;
  currency: string;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
};

export default function TransactionRow({
  tx,
  currency,
  selected,
  onToggleSelect,
  onDelete,
  deleting,
}: Props) {
  return (
    <tr
      className={cn(
        "border-b last:border-b-0 hover:bg-muted/30 transition-colors",
        selected && "bg-primary/5",
      )}
    >
      <td className="px-3 py-2.5">
        <input
          type="checkbox"
          className="rounded border-border"
          checked={selected}
          onChange={() => onToggleSelect(tx.id)}
        />
      </td>
      <td className="px-3 py-2.5 text-muted-foreground text-xs whitespace-nowrap">
        {new Date(tx.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </td>
      <td className="px-3 py-2.5 max-w-48">
        <p className="truncate font-medium">{tx.description ?? "—"}</p>
        {/* {tx.isAiCategorized &&
          tx.aiConfidenceScore !== null &&
          tx.aiConfidenceScore < 0.85 && (
            <span className="text-[10px] text-amber-500">
              ⚠ AI: {Math.round(tx.aiConfidenceScore * 100)}%
            </span>
          )} */}
      </td>
      <td className="px-3 py-2.5">
        {tx.category ? (
          <Badge
            variant="secondary"
            className="text-[10px] h-5 px-2"
            style={{
              backgroundColor: `${tx.category.color ?? "#6B7280"}20`,
              color: tx.category.color ?? "#6B7280",
            }}
          >
            {tx.category.name}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-3 py-2.5 text-right font-semibold whitespace-nowrap">
        <span
          className={
            tx.type === "INCOME"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400"
          }
        >
          {tx.type === "INCOME" ? "+" : "-"}
          {formatCurrency(tx.amount, currency)}
        </span>
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(tx.id)}
            disabled={deleting}
          >
            <FontAwesomeIcon icon={faTrashCan} className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
