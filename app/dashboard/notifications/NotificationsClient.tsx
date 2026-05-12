"use client";

import { useCallback, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faBellSlash,
  faCheckDouble,
} from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  LiveNotification,
  useNotificationSocket,
} from "@/hooks/use-notification-socket";

function timeAgo(date: string) {
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

export function NotificationsClient({
  initialNotifications,
}: {
  initialNotifications: LiveNotification[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);

  useNotificationSocket(
    useCallback(({ notification }) => {
      setNotifications((prev) => [
        notification,
        ...prev.filter((n) => n.id !== notification.id),
      ]);
    }, [])
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markAllRead" }),
    });

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markRead", id }),
    });

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={markAllRead}
          disabled={unreadCount === 0}
        >
          <FontAwesomeIcon icon={faCheckDouble} className="size-3.5" />
          Mark all read
        </Button>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
            <FontAwesomeIcon
              icon={faBellSlash}
              className="h-10 w-10 text-muted-foreground"
            />
            <p className="text-sm text-muted-foreground">
              No notifications yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => markRead(n.id)}
              className="block w-full text-left"
            >
              <Card
                className={cn(
                  "rounded-lg transition-colors hover:bg-muted/40",
                  !n.isRead && "border-primary/30 bg-primary/5"
                )}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <div
                    className={cn(
                      "shrink-0 rounded-lg p-2",
                      TYPE_COLORS[n.type] ?? "bg-muted text-muted-foreground"
                    )}
                  >
                    <FontAwesomeIcon icon={faBell} className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{n.title}</p>
                        <Badge variant="secondary" className="text-[10px]">
                          {n.type.replaceAll("_", " ")}
                        </Badge>
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {n.message}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
