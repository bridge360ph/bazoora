import { useMemo, useState } from "react";
import { useNotifications, useCreateNotification } from "../hooks";
import type { ReactNode } from "react";
import { Button, StatCard } from "@bazoora/ui";

interface AdminNotification {
  id: string;
  title: string;
  preview: string;
  fullMessage: string;
  timeAgo: string;
  date: string;
  hasGreenBorder?: boolean;
}

type Tab = "compose" | "history";

const notificationTypes = [
  "Select Type",
  "Alert",
  "Reminder",
  "Announcement",
  "Collection Notice",
];

const audienceTypes = [
  "Select type...",
  "All Users",
  "Residents",
  "Businesses",
  "Eco-Aides",
  "Fleet Drivers",
];

const inputClassName =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-[13.5px] text-gray-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15";

export function NotificationsPage() {
  const [tab, setTab] = useState<Tab>("compose");
  const { data: backendHistory = [] } = useNotifications();
  const createNotificationMutation = useCreateNotification();

  const history = useMemo<AdminNotification[]>(
    () =>
      backendHistory.map((notification) => {
        const createdAt = new Date(notification.createdAt);
        const trimmedMessage = notification.message.trim();

        return {
          id: notification.id,
          title: notification.title,
          preview:
            trimmedMessage.length > 70
              ? `${trimmedMessage.slice(0, 70)}...`
              : trimmedMessage,
          fullMessage: trimmedMessage,
          timeAgo: createdAt.toLocaleTimeString("en-PH", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          date: createdAt.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          hasGreenBorder: notification.totalReads === 0,
        };
      }),
    [backendHistory],
  );
  const [selected, setSelected] = useState<AdminNotification | null>(null);
  const [notificationType, setNotificationType] = useState("Select Type");
  const [audience, setAudience] = useState("Select type...");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const nextNotificationId = useMemo(
    () => `NTF-20260413-${String(history.length + 1).padStart(3, "0")}`,
    [history.length],
  );

  const totalSent = history.length;
  const totalReads = backendHistory.reduce(
    (sum, notification) => sum + notification.totalReads,
    0,
  );
  const alertsToday = history.filter((item) =>
    item.title.toLowerCase().includes("alert"),
  ).length;
  const totalRecipients = backendHistory.reduce(
    (sum, notification) => sum + notification.totalRecipients,
    0,
  );
  const averageReadRate =
    totalRecipients > 0
      ? `${Math.round((totalReads / totalRecipients) * 100)}%`
      : "0%";

  function showToast(messageText: string) {
    setToast(messageText);

    window.setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  function handleSend() {
    const isInvalid =
      !title.trim() ||
      !message.trim() ||
      notificationType === "Select Type" ||
      audience === "Select type...";

    if (isInvalid) {
      showToast("Please fill in all fields before sending.");
      return;
    }

    createNotificationMutation.mutate(
      {
        type: notificationType,
        audience,
        title: title.trim(),
        message: message.trim(),
      },
      {
        onSuccess: () => {
          const sentTitle = title.trim();

          setTitle("");
          setMessage("");
          setNotificationType("Select Type");
          setAudience("Select type...");
          showToast(`Notification "${sentTitle}" sent successfully.`);
          setTab("history");
        },
        onError: () => {
          showToast("Failed to send notification. Please try again.");
        },
      },
    );
  }

  return (
    <main className="p-6">
      <section className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Notifications & Announcements
          </h1>
          <p className="mt-1.5 text-[13px] text-gray-500">
            Compose announcements and review notification history for hauling
            users.
          </p>
        </div>
      </section>

      <section className="mb-[22px] grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Sent" value={String(totalSent)} />
        <StatCard label="Total Reads" value={String(totalReads)} />
        <StatCard label="Alerts Today" value={String(alertsToday)} />
        <StatCard label="Avg Read Rate" value={averageReadRate} />
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex border-b-2 border-gray-200">
          {[
            ["compose", "COMPOSE NEW"],
            ["history", "NOTIFICATION HISTORY"],
          ].map(([key, label]) => {
            const isActive = tab === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setTab(key as Tab);
                }}
                className={[
                  "-mb-0.5 cursor-pointer border-b-2 bg-transparent px-7 py-3.5 text-[13px] font-bold tracking-[0.5px] transition-colors",
                  isActive
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-600",
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>

        {tab === "compose" && (
          <div className="mx-auto max-w-[560px] px-6 py-7 sm:px-10">
            <FormField label="Notification ID">
              <input
                value={nextNotificationId}
                disabled
                className={`${inputClassName} cursor-not-allowed bg-gray-50 text-gray-400`}
              />
            </FormField>

            <FormField label="Notification Type">
              <select
                value={notificationType}
                onChange={(event) => {
                  setNotificationType(event.target.value);
                }}
                className={`${inputClassName} cursor-pointer`}
              >
                {notificationTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Target Audience">
              <select
                value={audience}
                onChange={(event) => {
                  setAudience(event.target.value);
                }}
                className={`${inputClassName} cursor-pointer`}
              >
                {audienceTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Title">
              <input
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                }}
                placeholder="Enter notification title..."
                className={inputClassName}
              />
            </FormField>

            <FormField label="Message">
              <textarea
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                }}
                placeholder="Enter notification message..."
                className={`${inputClassName} min-h-32 resize-y font-sans`}
              />
            </FormField>

            <Button
              type="button"
              onClick={handleSend}
              className="w-full !bg-brand px-3 py-[13px] text-sm font-bold tracking-[0.5px] text-white hover:!bg-brand-dark"
            >
              SEND NOTIFICATION
            </Button>
          </div>
        )}

        {tab === "history" && (
          <div className="py-2">
            {history.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-400">
                No notifications sent yet.
              </div>
            ) : (
              history.map((notification, index) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => {
                    setSelected(notification);
                  }}
                  className={[
                    "block w-full cursor-pointer border-l-[3px] bg-white px-6 py-[18px] text-left transition-colors hover:bg-gray-50",
                    notification.hasGreenBorder
                      ? "border-l-green-400"
                      : "border-l-transparent",
                    index < history.length - 1
                      ? "border-b border-b-gray-100"
                      : "",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 border-brand text-xs font-extrabold text-brand"
                        >
                          !
                        </span>
                        <span className="text-[15px] font-bold text-gray-900">
                          {notification.title}
                        </span>
                      </div>

                      <p className="mb-2 pl-[26px] text-[13px] leading-5 text-gray-500">
                        {notification.preview}
                      </p>

                      <div className="flex items-center gap-1.5 pl-[26px] text-xs text-gray-400">
                        <span aria-hidden="true">•</span>
                        <span>{notification.timeAgo}</span>
                      </div>
                    </div>

                    <span
                      aria-hidden="true"
                      className="text-2xl leading-none text-gray-400"
                    >
                      ›
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </section>

      {selected && (
        <NotificationDetailModal
          notification={selected}
          onClose={() => {
            setSelected(null);
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[2000] -translate-x-1/2 whitespace-nowrap rounded-[10px] bg-brand px-[22px] py-3 text-[13.5px] font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
          ✓ {toast}
        </div>
      )}
    </main>
  );
}

interface FormFieldProps {
  label: string;
  children: ReactNode;
}

function FormField({ label, children }: FormFieldProps) {
  return (
    <label className="mb-[18px] block">
      <span className="mb-[7px] block text-[12.5px] font-semibold text-gray-700">
        {label}
      </span>
      {children}
    </label>
  );
}

interface NotificationDetailModalProps {
  notification: AdminNotification;
  onClose: () => void;
}

function NotificationDetailModal({
  notification,
  onClose,
}: NotificationDetailModalProps) {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-white/60 p-6">
      <div className="max-h-[80vh] w-full max-w-[700px] overflow-y-auto rounded-[14px] bg-white px-6 py-8 shadow-[0_4px_40px_rgba(0,0,0,0.13)] sm:px-10 sm:py-9">
        <h2 className="mb-2.5 text-[26px] font-extrabold text-gray-900">
          {notification.title}
        </h2>
        <p className="mb-[18px] text-base font-semibold text-gray-700">
          {notification.date}
        </p>

        <p className="mb-4 text-sm text-gray-700">To all users,</p>
        <p className="mb-5 text-sm leading-7 text-gray-700">
          {notification.fullMessage}
        </p>
        <p className="mb-4 text-sm text-gray-700">
          Regards,
          <br />
          <strong>Admin 1</strong>
        </p>

        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          className="mt-2 w-full px-3 py-3"
        >
          Close
        </Button>
      </div>
    </div>
  );
}