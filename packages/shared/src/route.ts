import type { RouteStatus } from "./routeStatus.js";

export type WasteType =
  | "Regular"
  | "Recyclable"
  | "Regular/Non-Recyclable";

export type CollectionDay =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export interface Route {
  id: string;
  routeNumber: number;
  routeDisplayNumber: string;
  name: string;
  barangay: string;
  waypoints: string;
  wasteType: WasteType;
  collectionDay: CollectionDay;
  startTime: string;
  status: RouteStatus;
  stops: number;
  routeType: string;
  assignedEcoAideId: string | null;
  assignedTruckId: string | null;
}