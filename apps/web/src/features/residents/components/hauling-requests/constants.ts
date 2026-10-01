import type { LatLng, WasteType } from "./types";

export const WASTE_TYPES: WasteType[] = [
  "RESIDUAL",
  "NON_BIODEGRADABLE",
  "HAZARDOUS",
  "BIODEGRADABLE",
];

export const WASTE_TYPE_LABELS: Record<WasteType, string> = {
  RESIDUAL: "Residual Waste",
  NON_BIODEGRADABLE: "Non-Biodegradable Waste",
  HAZARDOUS: "Hazardous Waste",
  BIODEGRADABLE: "Biodegradable Waste",
};

/** Manila, used until at least one pickup address is located. */
export const DEFAULT_MAP_CENTER: LatLng = [14.5995, 120.9842];

export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_NOTE_LENGTH = 500;
export const MIN_ADDRESS_LENGTH = 5;
export const HISTORY_PAGE_SIZE = 8;
