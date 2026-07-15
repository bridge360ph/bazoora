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
  { label: "Residents", value: "RESIDENT" },
  { label: "Business", value: "BUSINESS" },
];

export const SENDER_DISPLAY = {
  RESIDENT: "Resident",
  BUSINESS: "Business",
} as const;

export const WASTE_TYPE_FILTER_OPTIONS = [
  {
    label: "All",
    value: "All",
  },
  {
    label: "Residual",
    value: "RESIDUAL",
  },
  {
    label: "Non-Biodegradable",
    value: "NON_BIODEGRADABLE",
  },
  {
    label: "Hazardous",
    value: "HAZARDOUS",
  },
  {
    label: "Biodegradable",
    value: "BIODEGRADABLE",
  },
] as const;

// Client-side pagination only; backend returns the full array
export const HAULING_REQUESTS_PAGE_SIZE = 7;