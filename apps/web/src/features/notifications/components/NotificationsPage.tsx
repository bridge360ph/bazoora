import { useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
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
    <main style={pageStyle}>
      <section style={pageHeaderStyle}>
        <div>
          <h1 style={pageTitleStyle}>Notifications & Announcements</h1>
          <p style={pageSubtitleStyle}>
            Compose announcements and review notification history for hauling
            users.
          </p>
        </div>
      </section>

      <section style={statsGridStyle}>
        <StatCard label="Total Sent" value={String(totalSent)} />
        <StatCard label="Total Reads" value={String(totalReads)} />
        <StatCard label="Alerts Today" value={String(alertsToday)} />
        <StatCard label="Avg Read Rate" value={averageReadRate} />
      </section>

      <section style={panelStyle}>
        <div style={tabListStyle}>
          {[
            ["compose", "COMPOSE NEW"],
            ["history", "NOTIFICATION HISTORY"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTab(key as Tab);
              }}
              style={{
                ...tabButtonStyle,
                color: tab === key ? "#111827" : "#9ca3af",
                borderBottom:
                  tab === key
                    ? "2px solid #111827"
                    : "2px solid transparent",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "compose" && (
          <div style={composeWrapperStyle}>
            <FormField label="Notification ID">
              <input
                value={nextNotificationId}
                disabled
                style={{
                  ...inputStyle,
                  background: "#f9fafb",
                  color: "#9ca3af",
                }}
              />
            </FormField>

            <FormField label="Notification Type">
              <select
                value={notificationType}
                onChange={(event) => {
                  setNotificationType(event.target.value);
                }}
                style={selectStyle}
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
                style={selectStyle}
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
                style={inputStyle}
              />
            </FormField>

            <FormField label="Message">
              <textarea
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                }}
                placeholder="Enter notification message..."
                style={textareaStyle}
              />
            </FormField>

            <Button
              type="button"
              onClick={handleSend}
              style={{
                width: "100%",
                padding: "13px",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 0.5,
              }}
            >
              SEND NOTIFICATION
            </Button>
          </div>
        )}

        {tab === "history" && (
          <div style={historyWrapperStyle}>
            {history.length === 0 ? (
              <div style={emptyStateStyle}>No notifications sent yet.</div>
            ) : (
              history.map((notification, index) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => {
                    setSelected(notification);
                  }}
                  style={{
                    ...historyItemStyle,
                    borderLeft: notification.hasGreenBorder
                      ? "3px solid #4ade80"
                      : "3px solid transparent",
                    borderBottom:
                      index < history.length - 1
                        ? "1px solid #f3f4f6"
                        : "none",
                  }}
                >
                  <div style={historyItemContentStyle}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={historyTitleRowStyle}>
                        <span aria-hidden="true" style={alertIconStyle}>
                          !
                        </span>
                        <span style={historyTitleStyle}>
                          {notification.title}
                        </span>
                      </div>

                      <p style={historyPreviewStyle}>{notification.preview}</p>

                      <div style={historyTimeStyle}>
                        <span aria-hidden="true">◷</span>
                        <span>{notification.timeAgo}</span>
                      </div>
                    </div>

                    <span aria-hidden="true" style={chevronStyle}>
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

      {toast && <div style={toastStyle}>✓ {toast}</div>}
    </main>
  );
}

interface FormFieldProps {
  label: string;
  children: ReactNode;
}

function FormField({ label, children }: FormFieldProps) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
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
    <div style={modalOverlayStyle}>
      <div style={modalCardStyle}>
        <h2 style={modalTitleStyle}>{notification.title}</h2>
        <p style={modalDateStyle}>{notification.date}</p>

        <p style={modalTextStyle}>To all users,</p>
        <p style={modalBodyStyle}>{notification.fullMessage}</p>
        <p style={modalTextStyle}>
          Regards,
          <br />
          <strong>Admin 1</strong>
        </p>

        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: 8,
          }}
        >
          Close
        </Button>
      </div>
    </div>
  );
}

const pageStyle: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "24px",
};

const pageHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 20,
  flexWrap: "wrap",
};

const pageTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 800,
  color: "#111827",
};

const pageSubtitleStyle: CSSProperties = {
  margin: "6px 0 0",
  fontSize: 13,
  color: "#6b7280",
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 14,
  marginBottom: 22,
};

const panelStyle: CSSProperties = {
  background: "#ffffff",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  overflow: "hidden",
};

const tabListStyle: CSSProperties = {
  display: "flex",
  borderBottom: "2px solid #e5e7eb",
};

const tabButtonStyle: CSSProperties = {
  padding: "14px 28px",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 0.5,
  marginBottom: -2,
};

const composeWrapperStyle: CSSProperties = {
  padding: "28px 40px",
  maxWidth: 560,
  margin: "0 auto",
};

const fieldStyle: CSSProperties = {
  display: "block",
  marginBottom: 18,
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: 7,
  fontSize: 12.5,
  fontWeight: 600,
  color: "#374151",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 13.5,
  outline: "none",
  background: "#ffffff",
  boxSizing: "border-box",
  color: "#111827",
};

const selectStyle: CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: 120,
  resize: "vertical",
  fontFamily: "inherit",
};

const historyWrapperStyle: CSSProperties = {
  padding: "8px 0",
};

const emptyStateStyle: CSSProperties = {
  padding: 40,
  textAlign: "center",
  color: "#9ca3af",
  fontSize: 14,
};

const historyItemStyle: CSSProperties = {
  width: "100%",
  display: "block",
  textAlign: "left",
  border: "none",
  background: "#ffffff",
  cursor: "pointer",
  padding: "18px 24px",
};

const historyItemContentStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
};

const historyTitleRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 5,
};

const alertIconStyle: CSSProperties = {
  width: 18,
  height: 18,
  borderRadius: "50%",
  border: "2px solid #1a3a2e",
  color: "#1a3a2e",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  fontWeight: 800,
  flexShrink: 0,
};

const historyTitleStyle: CSSProperties = {
  fontWeight: 700,
  fontSize: 15,
  color: "#111827",
};

const historyPreviewStyle: CSSProperties = {
  margin: "0 0 8px",
  fontSize: 13,
  color: "#6b7280",
  lineHeight: 1.5,
  paddingLeft: 26,
};

const historyTimeStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  paddingLeft: 26,
  fontSize: 12,
  color: "#9ca3af",
};

const chevronStyle: CSSProperties = {
  color: "#9ca3af",
  fontSize: 24,
  lineHeight: 1,
};

const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(255,255,255,0.6)",
  zIndex: 500,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
};

const modalCardStyle: CSSProperties = {
  background: "#ffffff",
  borderRadius: 14,
  padding: "36px 40px",
  maxWidth: 700,
  width: "100%",
  boxShadow: "0 4px 40px rgba(0,0,0,0.13)",
  maxHeight: "80vh",
  overflowY: "auto",
};

const modalTitleStyle: CSSProperties = {
  fontSize: 26,
  fontWeight: 800,
  color: "#111827",
  margin: "0 0 10px",
};

const modalDateStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: "#374151",
  margin: "0 0 18px",
};

const modalTextStyle: CSSProperties = {
  fontSize: 14,
  color: "#374151",
  margin: "0 0 16px",
};

const modalBodyStyle: CSSProperties = {
  fontSize: 14,
  color: "#374151",
  lineHeight: 1.75,
  margin: "0 0 20px",
};

const toastStyle: CSSProperties = {
  position: "fixed",
  bottom: 24,
  left: "50%",
  transform: "translateX(-50%)",
  background: "#1a3a2e",
  color: "#ffffff",
  padding: "12px 22px",
  borderRadius: 10,
  fontSize: 13.5,
  fontWeight: 500,
  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
  zIndex: 2000,
  whiteSpace: "nowrap",
};