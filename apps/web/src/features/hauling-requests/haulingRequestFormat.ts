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

/**
 * Formats a scheduled collection as e.g. "Mon, Nov 2, 2026, from 6:00 AM".
 * The truck starts its route at that time, so "from" sets the expectation
 * that the stop is reached some time after it.
 */
export function formatScheduledCollection(value: string | null | undefined): string {
  if (!value) return "Not scheduled yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const day = date.toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = date.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${day}, from ${time}`;
}

/** One entry per pickup stop (residents can submit several in one request). */
export function getPickupAddresses(requestAddress: string): string[] {
  return splitPickupAddresses(requestAddress);
}
