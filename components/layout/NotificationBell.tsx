"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export function NotificationBell() {
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [alert, setAlert] = useState<LiveNotification | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useNotificationSocket(
    useCallback(({ notification, unreadCount: liveUnreadCount }) => {
      setNotifications((prev) => [
        notification,
        ...prev.filter((n) => n.id !== notification.id),
      ]);
      setUnreadCount((prev) => liveUnreadCount ?? prev + 1);
      setAlert(notification);
    }, [])
  );

  useEffect(() => {
    if (!alert) return;

    const timeout = setTimeout(() => setAlert(null), 5_000);
    return () => clearTimeout(timeout);
  }, [alert]);

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markAllRead" }),
    });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markRead = async (id: string) => {
    const wasUnread = notifications.some((n) => n.id === id && !n.isRead);

    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markRead", id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  return (
    <>
      {alert && (
        <div className="fixed right-4 top-16 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-lg border bg-background p-4 text-sm shadow-lg">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-destructive/10 p-2 text-destructive">
              <FontAwesomeIcon icon={faBell} className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-snug">{alert.title}</p>
              <p className="mt-1 line-clamp-2 text-muted-foreground">
                {alert.message}
              </p>
            </div>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setAlert(null)}
              aria-label="Dismiss notification"
            >
              x
            </button>
          </div>
        </div>
      )}

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8"
            aria-label="Notifications"
          >
            <FontAwesomeIcon icon={faBell} className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b last:border-b-0",
                    !n.isRead && "bg-primary/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold line-clamp-1">
                      {n.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground line-clamp-2">
                    {n.message}
                  </span>
                  {!n.isRead && (
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary self-end" />
                  )}
                </button>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <Link
              href="/dashboard/notifications"
              className="block border-t px-4 py-2.5 text-center text-xs text-primary hover:bg-muted/50"
            >
              View all
            </Link>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
