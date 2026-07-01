type StatusTone = "success" | "warning" | "danger" | "neutral" | "info";

type SupportedStatus =
  | "Active"
  | "Available"
  | "On Route"
  | "Off Duty"
  | "Pending"
  | "Assigned"
  | "Completed"
  | "Approved"
  | "Denied"
  | "Suspended"
  | "Inactive";

interface StatusBadgeProps {
  children?: string;
  status?: SupportedStatus;
  tone?: StatusTone;
  className?: string;
}

const tones: Record<StatusTone, string> = {
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-800",
  danger: "bg-red-100 text-red-700",
  neutral: "bg-gray-100 text-gray-700",
  info: "bg-blue-100 text-blue-700",
};

const statusTones: Record<SupportedStatus, StatusTone> = {
  Active: "success",
  Available: "success",
  "On Route": "info",
  "Off Duty": "neutral",
  Pending: "warning",
  Assigned: "info",
  Completed: "success",
  Approved: "success",
  Denied: "danger",
  Suspended: "danger",
  Inactive: "neutral",
};

export function StatusBadge({
  children,
  status,
  tone,
  className,
}: StatusBadgeProps) {
  const label = children ?? status ?? "Unknown";
  const resolvedTone = tone ?? (status ? statusTones[status] : "neutral");

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[resolvedTone],
        className ?? "",
      ].join(" ")}
    >
      {label}
    </span>
  );
}