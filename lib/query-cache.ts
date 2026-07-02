/**
 * query-cache.ts
 *
 * Centralised server-side data cache using Next.js `unstable_cache`.
 * Every exported helper wraps a service/prisma call with:
 *   - a per-user cache key  (so one user's data never bleeds into another's)
 *   - one or more cache tags (so mutations can bust exactly the right entries)
 *   - a 60-second revalidation window as a safety net
 *
 * Pair with revalidateTag() calls in actions.ts files.
 */

import { unstable_cache } from "next/cache";
import * as analyticsService from "@/services/analytics.service";
import * as budgetService from "@/services/budget.service";
import * as transactionService from "@/services/transaction.service";
import { TransactionFilters } from "@/services/transaction.service";
import { prisma } from "@/prisma";

const REVALIDATE_SECONDS = 60;

// ---------------------------------------------------------------------------
// Tag helpers — keep tag names consistent between cache & invalidation sites
// ---------------------------------------------------------------------------

export const tags = {
  transactions: (userId: string) => `transactions-${userId}`,
  budgets: (userId: string) => `budgets-${userId}`,
  profile: (userId: string) => `profile-${userId}`,
  categories: (userId: string) => `categories-${userId}`,
};

// ---------------------------------------------------------------------------
// Analytics (Dashboard)
// ---------------------------------------------------------------------------

export function getCachedPeriodSummary(userId: string, start: Date, end: Date) {
  return unstable_cache(
    () => analyticsService.getPeriodSummary(userId, start, end),
    [
      "period-summary",
      userId,
      start.toISOString(),
      end.toISOString(),
    ],
    {
      revalidate: REVALIDATE_SECONDS,
      tags: [tags.transactions(userId)],
    },
  )();
}

export function getCachedCategoryBreakdown(
  userId: string,
  start: Date,
  end: Date,
) {
  return unstable_cache(
    () => analyticsService.getCategoryBreakdown(userId, start, end),
    [
      "category-breakdown",
      userId,
      start.toISOString(),
      end.toISOString(),
    ],
    {
      revalidate: REVALIDATE_SECONDS,
      tags: [tags.transactions(userId)],
    },
  )();
}

export function getCachedMonthlyTrend(userId: string, months: number) {
  return unstable_cache(
    () => analyticsService.getMonthlyTrend(userId, months),
    ["monthly-trend", userId, String(months)],
    {
      revalidate: REVALIDATE_SECONDS,
      tags: [tags.transactions(userId)],
    },
  )();
}

export async function getCachedRecentTransactions(
  userId: string,
  limit: number,
  start?: Date,
  end?: Date,
) {
  const result = await unstable_cache(
    () => analyticsService.getRecentTransactions(userId, limit, start, end),
    [
      "recent-transactions",
      userId,
      String(limit),
      start?.toISOString() ?? "none",
      end?.toISOString() ?? "none",
    ],
    {
      revalidate: REVALIDATE_SECONDS,
      tags: [tags.transactions(userId)],
    },
  )();

  return result.map((tx: any) => ({
    ...tx,
    date: new Date(tx.date),
    createdAt: new Date(tx.createdAt),
    updatedAt: new Date(tx.updatedAt),
    deletedAt: tx.deletedAt ? new Date(tx.deletedAt) : null,
  }));
}

// ---------------------------------------------------------------------------
// Transactions page
// ---------------------------------------------------------------------------

export async function getCachedUserTransactions(
  userId: string,
  filters: TransactionFilters,
) {
  // Build a stable, sorted key from the filters object
  const filterKey = JSON.stringify(
    Object.fromEntries(
      Object.entries(filters)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
  );

  const result = await unstable_cache(
    () => transactionService.getUserTransactions(userId, filters),
    ["user-transactions", userId, filterKey],
    {
      revalidate: REVALIDATE_SECONDS,
      tags: [tags.transactions(userId)],
    },
  )();

  return {
    ...result,
    transactions: result.transactions.map((tx: any) => ({
      ...tx,
      date: new Date(tx.date),
      createdAt: new Date(tx.createdAt),
      updatedAt: new Date(tx.updatedAt),
      deletedAt: tx.deletedAt ? new Date(tx.deletedAt) : null,
    })),
  };
}

// ---------------------------------------------------------------------------
// Budgets
// ---------------------------------------------------------------------------

export async function getCachedUserBudgets(userId: string) {
  const result = await unstable_cache(
    () => budgetService.getUserBudgets(userId),
    ["user-budgets", userId],
    {
      revalidate: REVALIDATE_SECONDS,
      // Spending totals change when transactions change, so tag both
      tags: [tags.budgets(userId), tags.transactions(userId)],
    },
  )();

  return result.map((b: any) => ({
    ...b,
    startDate: new Date(b.startDate),
    endDate: b.endDate ? new Date(b.endDate) : null,
    createdAt: new Date(b.createdAt),
    updatedAt: new Date(b.updatedAt),
  }));
}

export async function getCachedAllUserBudgetsWithSpend(userId: string) {
  const result = await unstable_cache(
    () => budgetService.getAllUserBudgetsWithSpend(userId),
    ["all-budgets-with-spend", userId],
    {
      revalidate: REVALIDATE_SECONDS,
      tags: [tags.budgets(userId), tags.transactions(userId)],
    },
  )();

  return result.map((b: any) => ({
    ...b,
    startDate: new Date(b.startDate),
    endDate: b.endDate ? new Date(b.endDate) : null,
    createdAt: new Date(b.createdAt),
    updatedAt: new Date(b.updatedAt),
  }));
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function getCachedCategories(userId: string) {
  const result = await unstable_cache(
    () =>
      prisma.category.findMany({
        where: { OR: [{ userId }, { isSystem: true }] },
        orderBy: { name: "asc" },
      }),
    ["categories", userId],
    {
      revalidate: REVALIDATE_SECONDS,
      tags: [tags.categories(userId)],
    },
  )();

  return result.map((c: any) => ({
    ...c,
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
  }));
}

// ---------------------------------------------------------------------------
// User profile
// ---------------------------------------------------------------------------

export async function getCachedUserProfile(userId: string) {
  const result = await unstable_cache(
    () => prisma.userProfile.findUnique({ where: { userId } }),
    ["user-profile", userId],
    {
      revalidate: REVALIDATE_SECONDS,
      tags: [tags.profile(userId)],
    },
  )();

  if (!result) return null;

  return {
    ...result,
    createdAt: new Date(result.createdAt),
    updatedAt: new Date(result.updatedAt),
  };
}
