import type { HaulingRequest } from "@bazoora/shared";

export type ModalMode = "detail" | "approve" | "deny" | null;

export interface HaulingRequestModalState {
  mode: ModalMode;
  request: HaulingRequest | null;
}

// UI-only sender filter; extends senderType with an "All" option.
export type SenderFilterValue = "All" | HaulingRequest["senderType"];

export type WasteTypeFilterValue =
  | "All"
  | "RESIDUAL"
  | "NON_BIODEGRADABLE"
  | "HAZARDOUS"
  | "BIODEGRADABLE";