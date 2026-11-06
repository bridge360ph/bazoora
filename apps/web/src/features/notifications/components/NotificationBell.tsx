import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bell } from "lucide-react";

import { useAuthStore } from "@/stores/auth-store";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useResidentNotifications,
} from "../hooks";
import { NotificationItem } from "./NotificationItem";

/**
 * Header bell with an unread badge. Clicking it opens a dropdown panel with
 * the signed-in user's notifications (hauling request updates, announcements).
 */
export function NotificationBell(): ReactNode {
  const user = useAuthStore((s) => s.user);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [], isLoading, isError } = useResidentNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead(user?.id);

  const unreadCount = notifications.filter(
    (notification) => notification.readAt === null,
  ).length;

  // Close on outside click or Escape.
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`relative rounded-lg p-2 transition hover:bg-white/10 hover:text-white ${
          isOpen ? "bg-white/10 text-white" : "text-gray-400"
        }`}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={isOpen}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="report-slide-in absolute right-0 top-full z-50 mt-2 flex max-h-[min(32rem,calc(100vh-6rem))] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-xl">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-gray-800">Notifications</p>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="text-[11px] font-semibold text-gray-500 hover:text-brand-dark disabled:opacity-50"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
            {isLoading ? (
              Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  className="h-16 shrink-0 animate-pulse rounded-md border border-gray-100 bg-gray-50"
                />
              ))
            ) : isError ? (
              <PanelMessage>
                We couldn&apos;t load your notifications. Please try again later.
              </PanelMessage>
            ) : notifications.length === 0 ? (
              <PanelMessage>
                No notifications yet. Updates on your hauling requests will
                appear here.
              </PanelMessage>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.receiptId}
                  notification={notification}
                  onSelect={() => {
                    if (notification.readAt === null) {
                      markRead.mutate(notification.receiptId);
                    }
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PanelMessage({ children }: { children: ReactNode }): ReactNode {
  return (
    <p className="px-4 py-8 text-center text-xs leading-5 text-gray-400">
      {children}
    </p>
  );
}
