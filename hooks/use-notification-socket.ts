"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

export interface LiveNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedEntityId?: string | null;
  relatedEntityType?: string | null;
}

interface NotificationSocketPayload {
  notification: LiveNotification;
  unreadCount?: number;
}

function normalizeNotification(notification: LiveNotification) {
  return {
    ...notification,
    createdAt: new Date(notification.createdAt).toISOString(),
  };
}

export function useNotificationSocket(
  onNotification: (payload: NotificationSocketPayload) => void
) {
  const callbackRef = useRef(onNotification);

  useEffect(() => {
    callbackRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    const socket: Socket = io({
      path: "/api/socket",
      withCredentials: true,
    });

    socket.on("notification:new", (payload: NotificationSocketPayload) => {
      callbackRef.current({
        ...payload,
        notification: normalizeNotification(payload.notification),
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);
}
