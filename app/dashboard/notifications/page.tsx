import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserNotifications } from "@/services/notification.service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const TYPE_COLORS: Record<string, string> = {
  BUDGET_WARNING: "bg-amber-500/10 text-amber-600",
  BUDGET_EXCEEDED: "bg-red-500/10 text-red-600",
  RECURRING_DUE: "bg-blue-500/10 text-blue-600",
  SYSTEM: "bg-muted text-muted-foreground",
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const notifications = await getUserNotifications(session.user.id, 50);

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">Notifications</h1>
        <p className="text-sm text-muted-foreground">{notifications.filter(n => !n.isRead).length} unread</p>
      </div>
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <BellOff className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className={cn(!n.isRead && "border-primary/30 bg-primary/5")}>
              <CardContent className="flex items-start gap-3 p-4">
                <div className={cn("p-2 rounded-lg shrink-0", TYPE_COLORS[n.type] ?? "bg-muted text-muted-foreground")}>
                  <Bell className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{n.title}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                </div>
                {!n.isRead && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
