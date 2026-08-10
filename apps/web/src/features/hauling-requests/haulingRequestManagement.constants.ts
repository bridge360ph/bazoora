import type { HaulingRequest } from "@bazoora/shared";
import type { SenderFilterValue } from "./haulingRequestManagement.types.ts";

// Maps the backend status enum to the label StatusBadge expects
export const STATUS_DISPLAY: Record<HaulingRequest["status"], string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  DENIED: "Denied",
};

export const WASTE_TYPE_DISPLAY: Record<
  HaulingRequest["wasteType"],
  string
> = {
  RESIDUAL: "Residual",
  NON_BIODEGRADABLE: "Non-Biodegradable",
  HAZARDOUS: "Hazardous",
  BIODEGRADABLE: "Biodegradable",
};

export const SENDER_FILTER_OPTIONS: {
  label: string;
  value: SenderFilterValue;
}[] = [
  { label: "All", value: "All" },
  { label: "Residents", value: "RESIDENT" },
  { label: "Business", value: "BUSINESS" },
];

// Client-side pagination only; backend returns the full array
export const HAULING_REQUESTS_PAGE_SIZE = 7;