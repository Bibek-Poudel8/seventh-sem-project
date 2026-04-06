import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as notificationService from "@/services/notification.service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [notifications, unreadCount] = await Promise.all([
    notificationService.getUserNotifications(session.user.id),
    notificationService.getUnreadCount(session.user.id),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (body.action === "markAllRead") {
    await notificationService.markAllAsRead(session.user.id);
    return NextResponse.json({ success: true });
  }

  if (body.action === "markRead" && body.id) {
    await notificationService.markAsRead(body.id, session.user.id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
