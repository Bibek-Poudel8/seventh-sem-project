"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  TransactionItem,
  TransactionCategory,
  formatCurrency,
} from "./transaction-types";
import { deleteTransaction } from "./actions";
import TransactionToolbar from "./TransactionToolbar";
import TransactionRow from "./TransactionRow";
import TransactionPagination from "./TransactionPagination";

interface Props {
  transactions: TransactionItem[];
  categories: TransactionCategory[];
  currency: string;
  total: number;
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

export default function TransactionTable({
  transactions,
  categories,
  currency,
  total,
  page,
  totalPages,
  searchParams,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const updatePage = (nextPage: number) => {
    const params = new URLSearchParams(
      Object.entries(searchParams).filter(([, value]) => value != null) as [
        string,
        string,
      ][],
    );
    params.set("page", String(nextPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    startTransition(() => deleteTransaction(id));
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = (checked: boolean) => {
    if (checked) setSelected(new Set(transactions.map((tx) => tx.id)));
    else setSelected(new Set());
  };

  return (
    <div className="space-y-4">
      <TransactionToolbar categories={categories} searchParams={searchParams} />

      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-10 px-3 py-2.5 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-border"
                    onChange={(e) => toggleAll(e.target.checked)}
                    checked={
                      selected.size === transactions.length &&
                      transactions.length > 0
                    }
                  />
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                  Code
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                  Date
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                  Description
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                  Category
                </th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">
                  Amount
                </th>
                <th className="px-3 py-2.5 text-center font-medium text-muted-foreground w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-12 text-center text-muted-foreground"
                  >
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    currency={currency}
                    selected={selected.has(tx.id)}
                    onToggleSelect={toggleSelect}
                    onDelete={handleDelete}
                    deleting={isPending}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionPagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPrevious={() => updatePage(page - 1)}
        onNext={() => updatePage(page + 1)}
      />
    </div>
  );
}
