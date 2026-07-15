import type { HaulingRequest } from "@bazoora/shared";
import type { SenderFilterValue } from "./haulingRequestManagement.types.ts";

// Maps the lowercase backend status to the label StatusBadge expects
export const STATUS_DISPLAY: Record<HaulingRequest["status"], string> = {
  pending: "Pending",
  approved: "Approved",
  denied: "Denied",
};

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