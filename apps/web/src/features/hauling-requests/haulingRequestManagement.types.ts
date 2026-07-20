import type { HaulingRequest } from "@bazoora/shared";

export type ModalMode = "detail" | "approve" | "deny" | null;

export interface HaulingRequestModalState {
  mode: ModalMode;
  request: HaulingRequest | null;
}

// UI-only sender filter; extends senderType with an "ALL" option.
export type SenderFilterValue = "ALL" | HaulingRequest["senderType"];

export type WasteTypeFilterValue =
  | "ALL"
  | "RESIDUAL"
  | "NON_BIODEGRADABLE"
  | "HAZARDOUS"
  | "BIODEGRADABLE";
