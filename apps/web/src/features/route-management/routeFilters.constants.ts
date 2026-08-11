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


export const WASTE_TYPES: WasteType[] = [
  "Regular",
  "Recyclable",
  "Regular/Non-Recyclable",
];


export const COLLECTION_DAYS: CollectionDay[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];