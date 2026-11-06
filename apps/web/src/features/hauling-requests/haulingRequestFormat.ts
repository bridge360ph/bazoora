import { splitPickupAddresses } from "@/features/residents/components/hauling-requests/utils";

/** Formats an ISO timestamp as e.g. "Oct 16, 2026, 9:30 AM". Falls back to "N/A". */
export function formatDateTime(value: string | undefined): string {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** One entry per pickup stop (residents can submit several in one request). */
export function getPickupAddresses(requestAddress: string): string[] {
  return splitPickupAddresses(requestAddress);
}
