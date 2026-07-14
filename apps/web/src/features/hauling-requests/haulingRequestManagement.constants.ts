import type { HaulingRequestStatus } from "@bazoora/shared";
import type { SenderFilterValue } from "./haulingRequestManagement.types.ts";

export const STATUS_DISPLAY = {
  PENDING: "Pending",
  APPROVED: "Approved",
  DENIED: "Denied",
} satisfies Record<HaulingRequestStatus, string>;

export const SENDER_FILTER_OPTIONS: {
  label: string;
  value: SenderFilterValue;
}[] = [
  { label: "All", value: "All" },
  { label: "Residents", value: "Resident" },
  { label: "Business", value: "Business" },
];

// Client-side pagination only; backend returns the full array
export const HAULING_REQUESTS_PAGE_SIZE = 7;