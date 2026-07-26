import type {
  SenderType,
  WasteType,
} from "@bazoora/shared";

/**
 * UI modal state for the hauling request management page.
 */
export type ModalMode =
  | "detail"
  | "approve"
  | "deny"
  | null;

/**
 * Filter values extend the shared enums with an "ALL" sentinel
 * used only by the frontend filter controls.
 */
export type SenderFilterValue =
  | SenderType
  | "ALL";

export type WasteTypeFilterValue =
  | WasteType
  | "ALL";

// Actual multi-select values - "ALL" is a picklist-only sentinel (it means
// "clear this filter"), never a member of the selected-values array itself.
export type SenderTypeValue = SenderType;
export type WasteTypeValue = WasteType;
