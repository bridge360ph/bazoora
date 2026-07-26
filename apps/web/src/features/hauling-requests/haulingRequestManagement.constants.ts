import type {
  HaulingRequestStatus,
  SenderType,
  WasteType,
} from "@bazoora/shared";
import type {
  SenderFilterValue,
  WasteTypeFilterValue,
} from "./haulingRequestManagement.types.ts";

export const STATUS_DISPLAY = {
  PENDING: "Pending",
  APPROVED: "Approved",
  DENIED: "Denied",
} satisfies Record<HaulingRequestStatus, string>;

export const SENDER_DISPLAY = {
  RESIDENT: "Resident",
  BUSINESS: "Business",
} satisfies Record<SenderType, string>;

export const WASTE_TYPE_DISPLAY = {
  RESIDUAL: "Residual",
  NON_BIODEGRADABLE: "Non-Biodegradable",
  HAZARDOUS: "Hazardous",
  BIODEGRADABLE: "Biodegradable",
} satisfies Record<WasteType, string>;

export const SENDER_FILTER_OPTIONS: {
  label: string;
  value: SenderFilterValue;
}[] = [
  { label: "All", value: "ALL" },
  { label: "Residents", value: "RESIDENT" },
  { label: "Business", value: "BUSINESS" },
];

export const WASTE_TYPE_FILTER_OPTIONS: {
  label: string;
  value: WasteTypeFilterValue;
}[] = [
  { label: "All", value: "ALL" },
  { label: "Residual", value: "RESIDUAL" },
  { label: "Non-Biodegradable", value: "NON_BIODEGRADABLE" },
  { label: "Hazardous", value: "HAZARDOUS" },
  { label: "Biodegradable", value: "BIODEGRADABLE" },
];

// Client-side pagination only; backend returns the full array.
export const HAULING_REQUESTS_PAGE_SIZE = 7;
