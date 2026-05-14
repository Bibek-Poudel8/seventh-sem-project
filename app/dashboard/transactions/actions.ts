"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import * as transactionService from "@/services/transaction.service";
import * as notificationService from "@/services/notification.service";
import * as budgetService from "@/services/budget.service";
import { prisma } from "@/prisma";
import { TransactionType } from "@/generated/prisma/client";

const TransactionSchema = z.object({
  description: z.string().min(1).max(100),
  amount: z.coerce.number().positive("Amount must be positive"),
  type: z.enum(["INCOME", "EXPENSE"]),
  date: z.string(),
  categoryId: z.string().optional(),
  customCategory: z.string().optional(),
  paymentMethodId: z.string().optional(),
  notes: z.string().max(300).optional(),
  isAiCategorized: z.coerce.boolean().optional(),
  aiCategoryRaw: z.string().optional(),
  aiConfidenceScore: z.coerce.number().min(0).max(1).optional(),
});

export type TransactionActionState =
  | {
      errors?: Record<string, string[]>;
      message?: string;
      success?: boolean;
      transactionId?: string;
    }
  | undefined;

async function getAuthSession() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  return {
    ...session,
    user: { ...session.user, id: session.user.id as string },
  };
}

export async function createTransaction(
  state: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const session = await getAuthSession();

  const raw = {
    description: formData.get("description"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    date: formData.get("date"),
    categoryId: formData.get("categoryId") || undefined,
    customCategory: formData.get("customCategory") || undefined,
    paymentMethodId: formData.get("paymentMethodId") || undefined,
    notes: formData.get("notes") || undefined,
    isAiCategorized: formData.get("isAiCategorized") || undefined,
    aiCategoryRaw: formData.get("aiCategoryRaw") || undefined,
    aiConfidenceScore: formData.get("aiConfidenceScore") || undefined,
  };

  const validated = TransactionSchema.safeParse(raw);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const {
    description,
    amount,
    type,
    date,
    categoryId,
    customCategory,
    paymentMethodId,
    notes,
    isAiCategorized,
    aiCategoryRaw,
    aiConfidenceScore,
  } = validated.data;

  let finalCategoryId = categoryId;

  // Handle custom category
  if (customCategory) {
    // Check if category already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: customCategory,
        userId: session.user.id!,
      },
    });

    if (existingCategory) {
      finalCategoryId = existingCategory.id;
    } else {
      // Create new category
      const newCategory = await prisma.category.create({
        data: {
          name: customCategory,
          userId: session.user.id!,
          type: type as TransactionType,
        },
      });
      finalCategoryId = newCategory.id;
    }
  }

  const now = new Date();
  // Get today's date in Nepal (GMT+5:45)
  const nepaliToday = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  let finalDate: Date;

  if (date === nepaliToday) {
    // If it's today in Nepal, use the current time
    finalDate = now;
  } else {
    // For other dates, set to 00:00:00 in Nepal timezone
    // We create a date at 00:00 UTC and then subtract 5:45 (345 mins) to get UTC equivalent
    const [y, m, d] = date.split("-").map(Number);
    finalDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    finalDate.setMinutes(finalDate.getMinutes() - 345);
  }

  const transaction = await transactionService.createTransaction({
    userId: session.user.id!,
    description,
    amount,
    type: type as TransactionType,
    date: finalDate,
    categoryId: finalCategoryId,
    paymentMethodId,
    notes,
    isAiCategorized,
    aiCategoryRaw,
    aiConfidenceScore,
  });

  // Check budget limits if it's an expense with a category
  if (type === "EXPENSE" && finalCategoryId && transaction) {
    const budgets = await budgetService.getUserBudgets(session.user.id!);
    const matchingBudget = budgets.find(
      (b) => b.categoryId === finalCategoryId,
    );
    if (matchingBudget) {
      const profile = await prisma.userProfile.findUnique({
        where: { userId: session.user.id! },
      });
      await notificationService.checkBudgetLimits(
        session.user.id!,
        finalCategoryId,
        matchingBudget.spent,
        Number(matchingBudget.amountLimit),
        profile?.notifyBudgetWarningPct ?? 80,
      );
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
  return { success: true, transactionId: transaction.id };
}

export async function updateTransaction(
  id: string,
  state: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const session = await getAuthSession();

  const raw = {
    description: formData.get("description"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    date: formData.get("date"),
    categoryId: formData.get("categoryId") || undefined,
    notes: formData.get("notes") || undefined,
  };

  const validated = TransactionSchema.partial().safeParse(raw);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { description, amount, type, date, categoryId, notes } = validated.data;

  let finalDate = undefined;
  if (date) {
    const now = new Date();
    const nepaliToday = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kathmandu",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    if (date === nepaliToday) {
      finalDate = now;
    } else {
      const [y, m, d] = date.split("-").map(Number);
      finalDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
      finalDate.setMinutes(finalDate.getMinutes() - 345);
    }
  }

  await transactionService.updateTransaction(id, session.user.id!, {
    description,
    amount,
    type: type as TransactionType | undefined,
    date: finalDate,
    categoryId: categoryId ?? null,
    notes,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
  return { success: true };
}

export async function deleteTransaction(id: string): Promise<void> {
  const session = await getAuthSession();
  await transactionService.deleteTransaction(id, session.user.id!);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
}

export async function bulkDeleteTransactions(ids: string[]): Promise<void> {
  const session = await getAuthSession();
  await transactionService.bulkDeleteTransactions(ids, session.user.id!);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
}
