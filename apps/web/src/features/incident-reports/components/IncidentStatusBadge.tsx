import type { ReactNode } from "react";
import type { IncidentStatus } from "@bazoora/shared";

export const INCIDENT_STATUS_LABEL: Record<IncidentStatus, string> = {
  PENDING: "PENDING",
  INVESTIGATING: "INVESTIGATING",
  RESOLVED: "RESOLVED",
  DENIED: "DENIED",
};

const BADGE_CLASSES: Record<IncidentStatus, string> = {
  PENDING: "bg-orange-100 text-orange-700",
  INVESTIGATING: "bg-sky-100 text-sky-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  DENIED: "bg-red-100 text-red-700",
};

const BORDER_CLASSES: Record<IncidentStatus, string> = {
  PENDING: "border-l-orange-400",
  INVESTIGATING: "border-l-sky-400",
  RESOLVED: "border-l-emerald-400",
  DENIED: "border-l-red-400",
};

export function IncidentStatusBadge({
  status,
}: {
  status: IncidentStatus;
}): ReactNode {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${BADGE_CLASSES[status]}`}
    >
      {INCIDENT_STATUS_LABEL[status]}
    </span>
  );
}

/** Left accent border per status, matching the hauling request cards. */
export function incidentBorderClass(status: IncidentStatus): string {
  return BORDER_CLASSES[status];
}

export function isClosedIncident(status: IncidentStatus): boolean {
  return status === "RESOLVED" || status === "DENIED";
}
