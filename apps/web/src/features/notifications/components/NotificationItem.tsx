import { useState, type ReactNode } from "react";
import {
  Bell,
  CalendarCheck,
  CheckCircle2,
  Clock,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import type { ResidentNotification } from "../api";

type NotificationStyle = {
  icon: LucideIcon;
  iconClass: string;
  borderClass: string;
};

// Hauling request notifications get status colors; anything else
// (announcements, route or truck updates) uses the neutral style.
const NOTIFICATION_STYLES: Record<string, NotificationStyle> = {
  HAULING_REQUEST_PENDING: {
    icon: Clock,
    iconClass: "bg-orange-50 text-orange-600",
    borderClass: "border-l-orange-400",
  },
  HAULING_REQUEST_APPROVED: {
    icon: CheckCircle2,
    iconClass: "bg-emerald-50 text-emerald-600",
    borderClass: "border-l-emerald-400",
  },
  HAULING_REQUEST_DENIED: {
    icon: XCircle,
    iconClass: "bg-red-50 text-red-600",
    borderClass: "border-l-red-400",
  },
  HAULING_REQUEST_SCHEDULED: {
    icon: CalendarCheck,
    iconClass: "bg-sky-50 text-sky-600",
    borderClass: "border-l-sky-400",
  },
};

const DEFAULT_NOTIFICATION_STYLE: NotificationStyle = {
  icon: Bell,
  iconClass: "bg-gray-100 text-gray-500",
  borderClass: "border-l-gray-300",
};

export function formatRelativeTime(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  if (Number.isNaN(diffMs)) return "";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function NotificationItem({
  notification,
  onSelect,
}: {
  notification: ResidentNotification;
  onSelect: () => void;
}): ReactNode {
  const style = NOTIFICATION_STYLES[notification.type] ?? DEFAULT_NOTIFICATION_STYLE;
  const Icon = style.icon;
  const isUnread = notification.readAt === null;
  // Click expands the full message (e.g. a long denial reason) and marks it read.
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        setIsExpanded((expanded) => !expanded);
        onSelect();
      }}
      aria-expanded={isExpanded}
      className={`flex w-full shrink-0 items-start gap-3 rounded-md border border-l-2 border-gray-200 px-4 py-3 text-left transition hover:border-gray-300 hover:shadow-sm ${style.borderClass} ${
        isUnread ? "bg-white" : "bg-gray-50/60"
      }`}
    >
      <span
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${style.iconClass}`}
      >
        <Icon className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p
            className={`min-w-0 break-words text-sm ${
              isUnread ? "font-bold text-gray-800" : "font-semibold text-gray-600"
            }`}
          >
            {notification.title}
          </p>
          <span className="shrink-0 text-[10px] text-gray-400">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>
        <p
          className={`mt-0.5 text-xs leading-5 text-gray-500 ${
            isExpanded ? "whitespace-pre-line break-words" : "line-clamp-2"
          }`}
        >
          {notification.message}
        </p>
      </div>

      {isUnread && (
        <span
          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-red-500"
          aria-label="Unread"
        />
      )}
    </button>
  );
}
