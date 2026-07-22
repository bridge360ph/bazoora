import type { RouteStatus } from "@bazoora/shared";

export type { RouteStatus };

export type RouteStatusFilter =
  | "All"
  | RouteStatus;

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
  name: string;
  barangay: string;
  waypoints: string;
  wasteType: WasteType;
  collectionDay: CollectionDay;
  startTime: string;
  ecoAide: string;
  fleetAssignment: string;
  status: RouteStatus;
  stops: number;
  routeType: string;
}

export interface RouteFormValue {
  name: string;
  barangay: string;
  waypoints: string;
  wasteType: WasteType;
  collectionDay: CollectionDay;
  startTime: string;
  ecoAide: string;
  fleetAssignment: string;
  routeType: string;
}