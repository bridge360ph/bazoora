import type {
  CollectionDay,
  WasteType,
  RouteStatus,
} from "@bazoora/shared";

// Frontend UI-only types

export type RouteStatusFilter =
  | "All"
  | RouteStatus;

export interface RouteFormValue {
  name: string;
  barangay: string;
  waypoints: string;
  wasteType: WasteType;
  collectionDay: CollectionDay;
  startTime: string;
  routeType: string;
}