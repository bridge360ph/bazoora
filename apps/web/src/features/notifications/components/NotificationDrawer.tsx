"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  Bell,
  BellOff,
  CheckCheck,
  AlertTriangle,
  Info,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import {
  useResidentNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "../hooks";
import type { ResidentNotification } from "../api";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function getTypeIcon(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes("alert")) {
    return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
  }
  if (normalized.includes("notice") || normalized.includes("collection")) {
    return <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />;
  }
  return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const user = useAuthStore((s) => s.user);
  const { data: notifications = [], isLoading } = useResidentNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead(user?.id);

  const [expandedReceiptId, setExpandedReceiptId] = useState<string | null>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.readAt === null).length,
    [notifications],
  );

  if (!isOpen) return null;

  const handleCardClick = (notification: ResidentNotification) => {
    if (notification.readAt === null) {
      markRead.mutate(notification.receiptId);
    }
    setExpandedReceiptId((prev) =>
      prev === notification.receiptId ? null : notification.receiptId,
    );
  };

  return (
    <div className="fixed inset-0 z-[2000] overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside
          className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-gray-100 dark:border-slate-800"
          role="dialog"
          aria-modal="true"
          aria-label="Notifications Drawer"
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                  Notifications
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? "s" : ""}` : "All updates caught up"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="p-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-gray-400">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-400 mb-3">
                  <BellOff className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  No notifications yet
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[240px]">
                  Operational alerts, hauling assignments, and announcements will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const isUnread = notification.readAt === null;
                const isExpanded = expandedReceiptId === notification.receiptId;

                return (
                  <article
                    key={notification.receiptId}
                    onClick={() => handleCardClick(notification)}
                    className={cn(
                      "p-4 cursor-pointer transition-colors relative flex flex-col gap-1.5",
                      isUnread
                        ? "bg-emerald-50/40 dark:bg-emerald-950/15 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/25"
                        : "hover:bg-gray-50/70 dark:hover:bg-slate-800/40",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {getTypeIcon(notification.type)}
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
                          {notification.type}
                        </span>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </div>

                    <h4
                      className={cn(
                        "text-sm leading-snug",
                        isUnread
                          ? "font-bold text-gray-900 dark:text-white"
                          : "font-semibold text-gray-700 dark:text-gray-300",
                      )}
                    >
                      {notification.title}
                    </h4>

                    <p
                      className={cn(
                        "text-xs text-gray-600 dark:text-gray-400 leading-relaxed",
                        !isExpanded && "line-clamp-2",
                      )}
                    >
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between pt-1 mt-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedReceiptId(isExpanded ? null : notification.receiptId);
                        }}
                        className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-0.5"
                      >
                        {isExpanded ? (
                          <>
                            Less <ChevronUp className="w-3 h-3" />
                          </>
                        ) : (
                          <>
                            Details <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </button>

                      {isUnread && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markRead.mutate(notification.receiptId);
                          }}
                          className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          Mark read
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}