import type { RouteStatus } from "./routeStatus.js";

/**
 * Shared Route model returned by the API.
 *
 * This is NOT a Prisma model.
 * It represents the API response contract.
 *
 * Frontend should treat this as read-only server data.
 */

/** The same four kinds residents pick on a hauling request. */
export type WasteType =
  | "BIODEGRADABLE"
  | "RESIDUAL"
  | "NON_BIODEGRADABLE"
  | "HAZARDOUS";

export type CollectionDay =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export interface AssignedEcoAide {
  id: string;
  name: string | null;
  userNumber: string | null;
}

/** A route stop placed on the map: its label, full address and position. */
export interface RouteStopLocation {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface AssignedTruck {
  id: string;
  truckNumber: string | null;
  plateNumber: string;
}

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
  /** Set on Paid (one-time) routes; null on Free weekly routes. */
  collectionDate: string | null;

  assignedEcoAideId: string | null;
  assignedEcoAide: AssignedEcoAide | null;
  assignedTruckId: string | null;
  assignedTruck: AssignedTruck | null;
  /** Null on routes created before stops were placed on a map. */
  stopLocations: RouteStopLocation[] | null;
  /** The branch the route path starts from. Null on older routes. */
  startBranchId: string | null;
}

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
