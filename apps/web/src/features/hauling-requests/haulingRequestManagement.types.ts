import type { HaulingRequest } from "@bazoora/shared";

// UI-only sender filter; extends senderType with an "All" option.
export type SenderFilterValue = "All" | HaulingRequest["senderType"];

export type ModalMode = "detail" | "approve" | "deny" | null;

export interface HaulingRequestModalState {
  mode: ModalMode;
  request: HaulingRequest | null;
}