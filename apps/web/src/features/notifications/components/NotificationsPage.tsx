import { useMemo, useState } from "react";
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

const initialHistory: AdminNotification[] = [
  {
    id: "NTF-20260413-001",
    title: "Holiday Schedule Reminder",
    preview:
      "The collection schedule will be adjusted for the upcoming holiday. Please prepare...",
    fullMessage:
      "The collection schedule will be adjusted for the upcoming holiday. Please prepare your bins ahead of time and wait for further updates from the hauling team.",
    timeAgo: "1 hour ago",
    date: "Monday, March 23, 2026",
    hasGreenBorder: false,
  },
  {
    id: "NTF-20260413-002",
    title: "Road Issue Alert",
    preview:
      "Due to road construction along Route B, the truck may arrive 20–30 minutes later...",
    fullMessage:
      "Due to road construction along Route B, the truck assigned to your area may arrive 20–30 minutes later than the scheduled time. We apologize for the inconvenience and appreciate your patience.",
    timeAgo: "2 hours ago",
    date: "Monday, March 23, 2026",
    hasGreenBorder: true,
  },
  {
    id: "NTF-20260413-003",
    title: "Truck Delay Notice",
    preview:
      "Truck #BT-02 is delayed due to a road issue near Purok 4. Expected resumption of...",
    fullMessage:
      "Truck #BT-02 is delayed due to a road issue near Purok 4. Expected resumption of operations is at 2:00 PM. Please be advised that collection in affected areas will be rescheduled accordingly.",
    timeAgo: "3 hours ago",
    date: "Monday, March 23, 2026",
    hasGreenBorder: true,
  },
  {
    id: "NTF-20260413-004",
    title: "Collection Reminder",
    preview:
      "Your next biodegradable waste collection is scheduled for tomorrow, June 18 at 7...",
    fullMessage:
      "Your next biodegradable waste collection is scheduled for tomorrow, June 18 at 7:00 AM. Please ensure your bins are placed outside by 6:45 AM.",
    timeAgo: "5 hours ago",
    date: "Sunday, March 22, 2026",
    hasGreenBorder: true,
  },
];

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
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-[13.5px] text-gray-900 outline-none transition focus:border-[#1a3a2e] focus:ring-2 focus:ring-[#1a3a2e]/15";

export function NotificationsPage() {
  const [tab, setTab] = useState<Tab>("compose");
  const [history, setHistory] = useState<AdminNotification[]>(initialHistory);
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
  const totalReads = history.length * 7;
  const alertsToday = history.filter((item) =>
    item.title.toLowerCase().includes("alert"),
  ).length;
  const averageReadRate = totalSent > 0 ? "82%" : "0%";

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

    const trimmedMessage = message.trim();

    const newNotification: AdminNotification = {
      id: nextNotificationId,
      title: title.trim(),
      preview:
        trimmedMessage.length > 70
          ? `${trimmedMessage.slice(0, 70)}...`
          : trimmedMessage,
      fullMessage: trimmedMessage,
      timeAgo: "just now",
      date: new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      hasGreenBorder: true,
    };

    setHistory((previousHistory) => [newNotification, ...previousHistory]);
    setTitle("");
    setMessage("");
    setNotificationType("Select Type");
    setAudience("Select type...");
    showToast(`Notification "${newNotification.title}" sent successfully.`);
    setTab("history");
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
              className="w-full !bg-[#1a3a2e] px-3 py-[13px] text-sm font-bold tracking-[0.5px] text-white hover:!bg-[#163127]"
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
                          className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 border-[#1a3a2e] text-xs font-extrabold text-[#1a3a2e]"
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
                        <span aria-hidden="true">◷</span>
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
        <div className="fixed bottom-6 left-1/2 z-[2000] -translate-x-1/2 whitespace-nowrap rounded-[10px] bg-[#1a3a2e] px-[22px] py-3 text-[13.5px] font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
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
