import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useResidentNotifications, useMarkNotificationRead } from "../hooks";
import { useAuthStore } from "@/stores/auth-store";
import { useSocket } from "@/hooks/use-socket";

export function NotificationListener() {
  const user = useAuthStore((state) => state.user);
  const shownReceiptIds = useRef(new Set<string>());
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const { data: notifications = [] } = useResidentNotifications();
  const markRead = useMarkNotificationRead();

  useEffect(() => {
    const handleNewNotification = () => {
      void queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, [socket, queryClient]);

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
        duration: Infinity,
        action: {
          label: "Mark as read",
          onClick: () => {
            markRead.mutate(notification.receiptId);
          },
        },
      });
    }
  }, [notifications, user, markRead]);

  return null;
}