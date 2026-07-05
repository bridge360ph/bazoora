import type { CSSProperties } from "react";

interface StatusBadgeProps {
  status: string;
}

const baseStyle: CSSProperties = {
  padding: "2px 10px",
  borderRadius: 12,
  fontSize: 12.5,
  fontWeight: 500,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  whiteSpace: "nowrap",
};

function getStatusStyle(status: string): CSSProperties {
  if (
    status === "Available" ||
    status === "Completed" ||
    status === "Approved"
  ) {
    return {
      color: "#166534",
      background: "#dcfce7",
    };
  }

  if (
    status === "Pending" ||
    status === "On Route" ||
    status === "In Progress"
  ) {
    return {
      color: "#92400e",
      background: "#fef3c7",
    };
  }

  if (
    status === "Assigned"
  ) {
    return {
      color: "#1d4ed8",
      background: "#dbeafe",
    };
  }

  if (
    status === "Denied" ||
    status === "Off Duty"
  ) {
    return {
      color: "#991b1b",
      background: "#fee2e2",
    };
  }

  return {
    color: "#6b7280",
    background: "#f3f4f6",
  };
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      style={{
        ...baseStyle,
        ...getStatusStyle(status),
      }}
    >
      {status}
    </span>
  );
}