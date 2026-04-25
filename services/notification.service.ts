import { prisma } from "@/prisma";
import { NotificationType } from "@/generated/prisma/client";

export async function checkBudgetLimits(
  userId: string,
  categoryId: string,
  spendTotal: number,
  budgetLimit: number,
  notifyAt: number = 80
) {
  const pct = budgetLimit > 0 ? (spendTotal / budgetLimit) * 100 : 0;

  if (pct >= 100) {
    await prisma.notification.create({
      data: {
        userId,
        type: NotificationType.BUDGET_EXCEEDED,
        title: "Budget Exceeded",
        message: `You have exceeded your budget. Spent ${formatAmount(spendTotal)} of ${formatAmount(budgetLimit)}.`,
        relatedEntityId: categoryId,
        relatedEntityType: "Category",
      },
    });
  } else if (pct >= notifyAt) {
    await prisma.notification.create({
      data: {
        userId,
        type: NotificationType.BUDGET_WARNING,
        title: "Budget Warning",
        message: `You have used ${Math.round(pct)}% of your budget (${formatAmount(spendTotal)} of ${formatAmount(budgetLimit)}).`,
        relatedEntityId: categoryId,
        relatedEntityType: "Category",
      },
    });
  }
}

export async function getUserNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export async function markAsRead(notificationId: string, userId: string) {
  await prisma.notification.update({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
}

export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "NPR",
    minimumFractionDigits: 0,
  }).format(amount);
}
