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
  /**
   * Picked in the form but saved through PATCH /routes/:id/assign-truck,
   * so it is stripped before the create and update requests.
   */
  assignedTruckId: string | null;
}