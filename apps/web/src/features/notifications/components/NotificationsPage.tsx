import { useMemo, useState } from "react";
import { useNotifications, useCreateNotification } from "../hooks";
import type { ReactNode } from "react";
import { ChevronRight, Send } from "lucide-react";
import { AdminPage, AdminPanel } from "@/components/admin/AdminPage";
import { AdminTabs } from "@/components/admin/AdminTabs";
import {
  AdminEmptySlot,
  AdminStat,
  BUTTON_CLASSES,
  INPUT_CLASSES,
} from "@/components/admin/AdminControls";
import { AdminListCard } from "@/components/admin/AdminListCard";
import { AdminModalShell, DetailField } from "@/components/admin/AdminModalShell";
import { AdminPagination, paginate } from "@/components/admin/AdminPagination";

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
  const [historyPage, setHistoryPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  const historyPagination = paginate(history, historyPage, rowsPerPage);

  return (
    <AdminPage fill>
      <section className="grid shrink-0 grid-cols-2 gap-4 xl:grid-cols-4">
        <AdminStat label="Total Sent" value={totalSent} />
        <AdminStat label="Total Reads" value={totalReads} />
        <AdminStat label="Alerts" value={alertsToday} />
        <AdminStat label="Avg Read Rate" value={averageReadRate} />
      </section>

      <AdminPanel className="min-h-0 flex-1">
        <AdminTabs
          tabs={[
            { value: "compose" as const, label: "COMPOSE NEW" },
            { value: "history" as const, label: "HISTORY", count: history.length },
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === "compose" && (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto flex max-w-xl flex-col gap-4 px-6 py-6">
              <FormField label="Notification ID">
                <input
                  value={nextNotificationId}
                  disabled
                  className={`${INPUT_CLASSES} cursor-not-allowed bg-gray-50 text-gray-400`}
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Notification Type">
                  <select
                    value={notificationType}
                    onChange={(event) => {
                      setNotificationType(event.target.value);
                    }}
                    className={`${INPUT_CLASSES} cursor-pointer`}
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
                    className={`${INPUT_CLASSES} cursor-pointer`}
                  >
                    {audienceTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField label="Title">
                <input
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                  }}
                  placeholder="Enter notification title..."
                  className={INPUT_CLASSES}
                />
              </FormField>

              <FormField label="Message">
                <textarea
                  value={message}
                  onChange={(event) => {
                    setMessage(event.target.value);
                  }}
                  placeholder="Enter notification message..."
                  className={`${INPUT_CLASSES} h-auto min-h-32 resize-y py-2`}
                />
              </FormField>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={createNotificationMutation.isPending}
                  className={BUTTON_CLASSES.primary}
                >
                  <Send className="h-3.5 w-3.5" />
                  {createNotificationMutation.isPending ? "Sending..." : "Send Notification"}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "history" && (
          <div className="flex min-h-0 flex-auto flex-col px-6 pb-6 pt-5">
            <div className="flex min-h-0 flex-auto flex-col gap-3 overflow-y-auto pr-1">
              {historyPagination.pageItems.map((notification) => (
                <AdminListCard
                  key={notification.id}
                  accentClassName={
                    notification.hasGreenBorder ? "border-l-emerald-400" : "border-l-gray-300"
                  }
                  onOpen={() => {
                    setSelected(notification);
                  }}
                  aside={
                    <span className="flex items-center text-[11px] font-semibold text-gray-500 group-hover:text-gray-800">
                      Details
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  }
                >
                  <p className="text-sm font-bold text-gray-800">{notification.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-600">{notification.preview}</p>
                  <p className="mt-1 text-[10px] text-gray-500">
                    {notification.date} · {notification.timeAgo}
                    {notification.hasGreenBorder && " · Not read yet"}
                  </p>
                </AdminListCard>
              ))}

              {historyPagination.total === 0 ? (
                <AdminEmptySlot>No notifications sent yet.</AdminEmptySlot>
              ) : (
                historyPagination.page === historyPagination.totalPages && (
                  <AdminEmptySlot>No more notifications</AdminEmptySlot>
                )
              )}
            </div>

            <AdminPagination
              {...historyPagination}
              onPageChange={setHistoryPage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(rows) => {
                setRowsPerPage(rows);
                setHistoryPage(1);
              }}
            />
          </div>
        )}
      </AdminPanel>

      {selected && (
        <NotificationDetailModal
          notification={selected}
          onClose={() => {
            setSelected(null);
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[2000] -translate-x-1/2 whitespace-nowrap rounded-md bg-brand-dark px-5 py-2.5 text-xs font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </AdminPage>
  );
}

interface FormFieldProps {
  label: string;
  children: ReactNode;
}

function FormField({ label, children }: FormFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">{label}</span>
      {children}
    </label>
  );
}

interface NotificationDetailModalProps {
  notification: AdminNotification;
  onClose: () => void;
}

function NotificationDetailModal({ notification, onClose }: NotificationDetailModalProps) {
  return (
    <AdminModalShell
      eyebrow="NOTIFICATION"
      title={notification.title}
      onClose={onClose}
      maxWidthClassName="max-w-2xl"
      footer={
        <button type="button" onClick={onClose} className={BUTTON_CLASSES.ghost}>
          Close
        </button>
      }
    >
      <DetailField label="SENT">
        {notification.date} · {notification.timeAgo}
      </DetailField>

      <p className="mt-5 whitespace-pre-line text-sm leading-6 text-gray-700">
        {notification.fullMessage}
      </p>
    </AdminModalShell>
  );
}
