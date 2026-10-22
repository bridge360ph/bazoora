import type { ReactNode } from "react";
import type { HaulingRequestStatus } from "@bazoora/shared";

import { getStatusClasses } from "@/features/residents/components/hauling-requests/utils";

/** Same colors as the resident StatusBadge, sized for the admin list. */
export function HaulingStatusBadge({
  status,
  className = "",
}: {
  status: HaulingRequestStatus;
  className?: string;
}): ReactNode {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${getStatusClasses(status)} ${className}`}
    >
      {status}
    </span>
  );
}

/** Left accent border per status, as on the resident report history cards. */
export function statusBorderClass(status: HaulingRequestStatus): string {
  switch (status) {
    case "APPROVED":
      return "border-l-emerald-400";
    case "DENIED":
      return "border-l-red-400";
    case "PENDING":
    default:
      return "border-l-orange-400";
  }
}
