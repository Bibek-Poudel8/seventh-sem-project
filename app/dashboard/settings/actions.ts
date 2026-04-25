"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/prisma";
import bcrypt from "bcryptjs";
import { TransactionType, Theme } from "@/generated/prisma/client";

async function getAuthSession() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  return { ...session, user: { ...session.user, id: session.user.id as string } };
}

const ProfileSchema = z.object({
  name: z.string().min(2),
  currency: z.string().length(3),
  timezone: z.string().min(1),
});

export async function updateProfile(
  state: { errors?: Record<string, string[]>; success?: boolean } | undefined,
  formData: FormData
) {
  const session = await getAuthSession();

  const raw = {
    name: formData.get("name"),
    currency: formData.get("currency"),
    timezone: formData.get("timezone"),
  };

  const validated = ProfileSchema.safeParse(raw);
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors };

  await prisma.user.update({
    where: { id: session.user.id! },
    data: { name: validated.data.name },
  });

  await prisma.userProfile.upsert({
    where: { userId: session.user.id! },
    update: { currency: validated.data.currency, timezone: validated.data.timezone },
    create: { userId: session.user.id!, currency: validated.data.currency, timezone: validated.data.timezone },
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}

const PasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/[a-zA-Z]/).regex(/[0-9]/),
  confirmPassword: z.string().min(1),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function changePassword(
  state: { errors?: Record<string, string[]>; message?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const session = await getAuthSession();

  const raw = {
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const validated = PasswordSchema.safeParse(raw);
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors };

  const user = await prisma.user.findUnique({ where: { id: session.user.id! } });
  if (!user?.password) return { message: "Password change not available for OAuth accounts" };

  const match = await bcrypt.compare(validated.data.currentPassword, user.password);
  if (!match) return { errors: { currentPassword: ["Current password is incorrect"] } };

  const hashed = await bcrypt.hash(validated.data.newPassword, 12);
  await prisma.user.update({ where: { id: session.user.id! }, data: { password: hashed } });

  revalidatePath("/dashboard/settings");
  return { success: true };
}

const PreferencesSchema = z.object({
  theme: z.enum(["LIGHT", "DARK", "SYSTEM"]),
  weekStartsOn: z.coerce.number().int().min(0).max(1),
  dateFormat: z.string().min(1),
  defaultTransactionType: z.enum(["INCOME", "EXPENSE"]),
  notifyBudgetWarningPct: z.coerce.number().int().min(1).max(100),
});

export async function updatePreferences(
  state: { success?: boolean } | undefined,
  formData: FormData
) {
  const session = await getAuthSession();

  const raw = {
    theme: formData.get("theme"),
    weekStartsOn: formData.get("weekStartsOn"),
    dateFormat: formData.get("dateFormat"),
    defaultTransactionType: formData.get("defaultTransactionType"),
    notifyBudgetWarningPct: formData.get("notifyBudgetWarningPct"),
  };

  const validated = PreferencesSchema.safeParse(raw);
  if (!validated.success) return { success: false };

  await prisma.userProfile.upsert({
    where: { userId: session.user.id! },
    update: {
      theme: validated.data.theme as Theme,
      weekStartsOn: validated.data.weekStartsOn,
      dateFormat: validated.data.dateFormat,
      defaultTransactionType: validated.data.defaultTransactionType as TransactionType,
      notifyBudgetWarningPct: validated.data.notifyBudgetWarningPct,
    },
    create: {
      userId: session.user.id!,
      theme: validated.data.theme as Theme,
      weekStartsOn: validated.data.weekStartsOn,
      dateFormat: validated.data.dateFormat,
      defaultTransactionType: validated.data.defaultTransactionType as TransactionType,
      notifyBudgetWarningPct: validated.data.notifyBudgetWarningPct,
    },
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function deleteAccount(): Promise<void> {
  const session = await getAuthSession();
  await prisma.user.delete({ where: { id: session.user.id! } });
  redirect("/");
}
