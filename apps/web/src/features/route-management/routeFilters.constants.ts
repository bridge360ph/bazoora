import type {
  RouteStatusFilter,
} from "./route.types";

import type {
  CollectionDay,
  WasteType,
} from "@bazoora/shared";


export const ROUTE_STATUS_FILTERS: RouteStatusFilter[] = [
  "All",
  "In Progress",
  "Not Started",
  "Completed",
];


// The same four kinds residents pick on a hauling request.
export const WASTE_TYPES: WasteType[] = [
  "BIODEGRADABLE",
  "RESIDUAL",
  "NON_BIODEGRADABLE",
  "HAZARDOUS",
];

export const WASTE_TYPE_LABELS: Record<WasteType, string> = {
  BIODEGRADABLE: "Biodegradable",
  RESIDUAL: "Residual",
  NON_BIODEGRADABLE: "Non-Biodegradable",
  HAZARDOUS: "Hazardous",
};

/** A label for a stored waste type, falling back to the raw value. */
export function formatWasteType(value: string): string {
  return WASTE_TYPE_LABELS[value as WasteType] ?? value;
}


export const COLLECTION_DAYS: CollectionDay[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];