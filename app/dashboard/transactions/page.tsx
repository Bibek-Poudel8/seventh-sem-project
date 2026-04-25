import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { getUserTransactions } from "@/services/transaction.service";
import { prisma } from "@/prisma";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download, Filter } from "lucide-react";
import TransactionTable from "./TransactionTable";

function formatCurrency(amount: number, currency = "NPR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface SearchParams {
  category?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  keyword?: string;
  amountMin?: string;
  amountMax?: string;
  page?: string;
  sortBy?: string;
  sortOrder?: string;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const params = await searchParams;
  const userId = session.user.id;

  const [{ transactions, total }, categories, profile] = await Promise.all([
    getUserTransactions(userId, {
      category: params.category,
      type: params.type as "INCOME" | "EXPENSE" | undefined,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      keyword: params.keyword,
      amountMin: params.amountMin ? Number(params.amountMin) : undefined,
      amountMax: params.amountMax ? Number(params.amountMax) : undefined,
      page: params.page ? Number(params.page) : 1,
      sortBy: params.sortBy ?? "date",
      sortOrder: (params.sortOrder as "asc" | "desc") ?? "desc",
    }),
    prisma.category.findMany({
      where: { OR: [{ userId }, { isSystem: true }] },
      orderBy: { name: "asc" },
    }),
    prisma.userProfile.findUnique({ where: { userId } }),
  ]);

  const currency = profile?.currency ?? "NPR";
  const page = params.page ? Number(params.page) : 1;
  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground">{total} total records</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/export/csv?${new URLSearchParams(params as Record<string, string>).toString()}`}
            download
          >
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </a>
          <Link href="/dashboard/transactions?add=1">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add Transaction
            </Button>
          </Link>
        </div>
      </div>

      {/* Table */}
      <TransactionTable
        transactions={transactions.map((t) => ({
          ...t,
          amount: Number(t.amount),
          aiConfidenceScore: t.aiConfidenceScore ?? null,
        }))}
        categories={categories}
        currency={currency}
        total={total}
        page={page}
        totalPages={totalPages}
        searchParams={params as Record<string, string | undefined>}
      />
    </div>
  );
}
