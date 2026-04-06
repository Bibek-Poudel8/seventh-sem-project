import { prisma } from "@/prisma";
import { TransactionFilters } from "./transaction.service";

export async function exportCSV(
  userId: string,
  filters: TransactionFilters = {}
): Promise<string> {
  const { dateFrom, dateTo, category, type } = filters;

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      isDeleted: false,
      ...(dateFrom || dateTo
        ? {
            date: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(dateTo) } : {}),
            },
          }
        : {}),
      ...(category ? { category: { name: category } } : {}),
      ...(type ? { type } : {}),
    },
    include: { category: true, paymentMethod: true },
    orderBy: { date: "desc" },
  });

  const header = "Date,Description,Category,Type,Amount,Payment Method,Notes\n";
  const rows = transactions
    .map((tx) =>
      [
        new Date(tx.date).toISOString().split("T")[0],
        `"${(tx.description ?? "").replace(/"/g, '""')}"`,
        tx.category?.name ?? "Uncategorized",
        tx.type,
        Number(tx.amount).toFixed(2),
        tx.paymentMethod?.name ?? "",
        `"${(tx.notes ?? "").replace(/"/g, '""')}"`,
      ].join(",")
    )
    .join("\n");

  return header + rows;
}
