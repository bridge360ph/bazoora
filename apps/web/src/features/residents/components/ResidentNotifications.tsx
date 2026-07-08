"use client";

import { Bell, CheckCircle, Truck, Leaf, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  useResidentNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useLatestNotificationPolling,
} from "@/features/notifications/hooks";
import { useAuthStore } from "@/stores/auth-store";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { Notification } from "@/features/notifications/schemas";
import { formatDistanceToNow } from "date-fns";

function NotificationIcon({
  driverType,
}: {
  driverType: Notification["driverType"];
}): React.ReactNode {
  if (driverType === "government") {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Truck className="h-5 w-5" />
      </div>
    );
  }
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
      <Leaf className="h-5 w-5" />
    </div>
  );
}

export default function ResidentNotifications(): React.ReactNode {
  const user = useAuthStore((s) => s.user);
  const { data: notifications, isLoading } = useResidentNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead(user?.id);

  const lastSeenIdRef = useRef<string | null>(null);
  const { data: latestNotification } = useLatestNotificationPolling(user?.id);

  useEffect(() => {
    if (
      latestNotification &&
      latestNotification.id !== lastSeenIdRef.current &&
      latestNotification.status === "picked_up" &&
      !latestNotification.read
    ) {
      lastSeenIdRef.current = latestNotification.id;
      const driverLabel =
        latestNotification.driverType === "government" ? "Municipal Truck" : "EcoAide";
      toast.success(`Waste collected by ${driverLabel}`, {
        description: latestNotification.message,
        duration: 6000,
        icon: "🗑️",
      });
    }
  }, [latestNotification]);

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="dark:bg-background flex h-full flex-col bg-[#F5F5F5] overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl flex-1 p-4 pb-20 lg:p-8 lg:pb-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="hidden text-xl font-bold tracking-widest text-gray-900 uppercase lg:block dark:text-white">
              NOTIFICATIONS
            </h2>
            <h2 className="text-xl font-bold text-gray-900 lg:hidden dark:text-white">
              Notifications
            </h2>
            <p className="mt-1 text-sm font-medium text-gray-500">
              {isLoading
                ? "Loading…"
                : unreadCount > 0
                  ? `${String(unreadCount)} unread`
                  : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => {
                markAllRead.mutate();
              }}
              disabled={markAllRead.isPending}
              className="flex items-center gap-1.5 text-sm font-bold text-[#f97316] transition-colors hover:text-[#ea580c] disabled:opacity-50 cursor-pointer"
            >
              {markAllRead.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Mark all read
            </button>
          )}
        </div>

        {/* Notifications list */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <p className="mt-4 text-xs font-bold tracking-widest text-gray-400 uppercase">
              Loading…
            </p>
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                onClick={() => {
                  if (!notification.read) markRead.mutate(notification.id);
                }}
                className={`cursor-pointer rounded-2xl border-0 shadow-sm transition-all hover:shadow-md ${
                  notification.read ? "dark:bg-slate-900 bg-white" : "dark:bg-slate-900 bg-[#fdfaf6]"
                }`}
              >
                <CardContent className="flex gap-4 p-5">
                  <NotificationIcon driverType={notification.driverType} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-base font-bold text-gray-900 dark:text-white">
                        {notification.driverType === "government"
                          ? "Municipal Truck Pickup"
                          : "Eco Aide Collection"}
                      </p>
                      {!notification.read && (
                        <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#f97316]" />
                      )}
                    </div>
                    <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">{notification.message}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black tracking-widest uppercase ${
                          notification.driverType === "government"
                            ? "bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400"
                            : "bg-emerald-50 text-emerald-600 dark:bg-slate-800 dark:text-emerald-450"
                        }`}
                      >
                        {notification.driverType === "government" ? (
                          <Truck className="h-2.5 w-2.5" />
                        ) : (
                          <Leaf className="h-2.5 w-2.5" />
                        )}
                        {notification.driverType === "government" ? "Municipal" : "Eco Aide"}
                      </span>
                      <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="dark:bg-slate-900/50 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-100 bg-white/50 py-20 text-center dark:border-gray-700">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 dark:bg-slate-800 text-gray-300">
              <Bell className="h-8 w-8" />
            </div>
            <p className="text-sm font-black text-gray-900 dark:text-white">No notifications yet</p>
            <p className="mt-1 text-xs font-medium text-gray-500">
              Pickup notifications will appear here in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
