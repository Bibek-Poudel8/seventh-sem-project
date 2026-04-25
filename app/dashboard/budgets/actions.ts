"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import * as budgetService from "@/services/budget.service";
import { BudgetPeriod } from "@/generated/prisma/client";

const BudgetSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"]),
  amountLimit: z.coerce.number().positive("Amount must be positive"),
  startDate: z.string(),
  endDate: z.string().optional(),
});

export type BudgetActionState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
} | undefined;

async function getAuthSession() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  return { ...session, user: { ...session.user, id: session.user.id as string } };
}

export async function createBudget(
  state: BudgetActionState,
  formData: FormData
): Promise<BudgetActionState> {
  const session = await getAuthSession();

  const raw = {
    categoryId: formData.get("categoryId"),
    period: formData.get("period"),
    amountLimit: formData.get("amountLimit"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") || undefined,
  };

  const validated = BudgetSchema.safeParse(raw);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { categoryId, period, amountLimit, startDate, endDate } = validated.data;

  await budgetService.createBudget({
    userId: session.user.id!,
    categoryId,
    period: period as BudgetPeriod,
    amountLimit,
    startDate: new Date(startDate),
    endDate: endDate ? new Date(endDate) : undefined,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/budgets");
  return { success: true };
}

export async function updateBudget(
  id: string,
  state: BudgetActionState,
  formData: FormData
): Promise<BudgetActionState> {
  const session = await getAuthSession();

  const raw = {
    categoryId: formData.get("categoryId"),
    period: formData.get("period"),
    amountLimit: formData.get("amountLimit"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") || undefined,
  };

  const validated = BudgetSchema.safeParse(raw);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { categoryId, period, amountLimit, startDate, endDate } = validated.data;

  await budgetService.updateBudget(id, session.user.id!, {
    categoryId,
    period: period as BudgetPeriod,
    amountLimit,
    startDate: new Date(startDate),
    endDate: endDate ? new Date(endDate) : null,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/budgets");
  return { success: true };
}

export async function deleteBudget(id: string): Promise<void> {
  const session = await getAuthSession();
  await budgetService.deleteBudget(id, session.user.id!);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/budgets");
}
