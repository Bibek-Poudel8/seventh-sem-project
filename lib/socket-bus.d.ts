import type { Notification } from "@/generated/prisma/client";

export interface UserNotificationPayload {
  userId: string;
  notification: Notification;
  unreadCount?: number;
}

export const notificationBus: {
  on(event: "notification:new", listener: (payload: UserNotificationPayload) => void): void;
  emit(event: "notification:new", payload: UserNotificationPayload): boolean;
};

export function emitUserNotification(
  userId: string,
  notification: Notification,
  unreadCount?: number
): void;
