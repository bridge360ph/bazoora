import type {
  CollectionDay,
  WasteType,
  RouteStatus,
} from "@bazoora/shared";

export type { RouteStatus };

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
  assignedEcoAideId: string | null;
}