import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserNotifications } from "@/services/notification.service";
import { NotificationsClient } from "./NotificationsClient";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const notifications = await getUserNotifications(session.user.id, 50);

  return (
    <NotificationsClient
      initialNotifications={notifications.map((notification) => ({
        ...notification,
        createdAt: notification.createdAt.toISOString(),
      }))}
    />
  );
}
