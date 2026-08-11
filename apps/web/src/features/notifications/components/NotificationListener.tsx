import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useResidentNotifications, useMarkNotificationRead } from "../hooks";
import { useAuthStore } from "@/stores/auth-store";

export function NotificationListener() {
  const user = useAuthStore((state) => state.user);
  const shownReceiptIds = useRef(new Set<string>());

  const { data: notifications = [] } = useResidentNotifications();
  const markRead = useMarkNotificationRead();

  useEffect(() => {
    if (!user) return;

    const unread = notifications.filter(
      (notification) =>
        notification.readAt === null &&
        !shownReceiptIds.current.has(notification.receiptId),
    );

    for (const notification of unread) {
      shownReceiptIds.current.add(notification.receiptId);

      toast(notification.title, {
        description: notification.message,
        duration: 8000,
      });

      markRead.mutate(notification.receiptId);
    }
  }, [notifications, user, markRead]);

  return null;
}