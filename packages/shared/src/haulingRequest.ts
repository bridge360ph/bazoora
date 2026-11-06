import type { CollectionDay, RouteStopLocation, WasteType } from "./route.js";

export type SenderType =
  | "RESIDENT"
  | "BUSINESS";

/** Routes and hauling requests use the same waste types. */
export type HaulingWasteType = WasteType;

export type HaulingRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "DENIED";

export interface HaulingRequest {
  requestId: string;
  requestNumber: string;
  
  userId: string;
  orgId?: string;

  requestAddress: string;

  /** Map positions of the pickup stops, in the order the resident listed them. */
  pickupLocations?: HaulingPickupLocation[];

  /** True when the resident wants the stops collected in the order listed. */
  keepStopOrder: boolean;

  senderType: SenderType;

  wasteType: HaulingWasteType;

  imageUrl?: string;
  pickupDate: string;
  status: HaulingRequestStatus;

  approvedBy?: string;
  approvedAt?: string;

  denialReason?: string;

  note?: string;

  archived?: boolean;

  /** The collection route this request was assigned to, if any. */
  routeId?: string;
  route?: HaulingRequestRoute;

  createdAt?: string;
  updatedAt?: string;
}

/** One pickup stop of a hauling request. lat/lng are null when not placed on the map. */
export interface HaulingPickupLocation {
  address: string;
  lat: number | null;
  lng: number | null;
}

/** The route summary returned with a hauling request. */
export interface HaulingRequestRoute {
  id: string;
  routeDisplayNumber: string;
  name: string;
  collectionDay: CollectionDay;
  startTime: string;
  wasteType: WasteType;
  ecoAideName: string | null;
  /**
   * When the request is actually collected: the route's next run on or
   * after the preferred pickup date, at the route's start time.
   */
  scheduledCollectionAt: string | null;
}

/** Body accepted by PATCH /hauling-requests/:id/approve. */
export interface ApproveHaulingRequestInput {
  /** Optional: a route can also be assigned later. */
  routeId?: string | null;
}

/** Body accepted by PATCH /hauling-requests/:id/route. */
export interface AssignHaulingRequestRouteInput {
  /** Null takes the request off its route. */
  routeId: string | null;
}

/** A route the admin can pick for a hauling request. */
export interface HaulingRouteOption {
  id: string;
  routeDisplayNumber: string;
  name: string;
  barangay: string;
  collectionDay: CollectionDay;
  wasteType: WasteType;
  ecoAideName: string | null;
  /** "Free" weekly route or "Paid" one-time route. */
  routeType: string;
  /** YYYY-MM-DD for Paid routes, null for Free ones. */
  collectionDate: string | null;
}

/**
 * Body accepted by POST /hauling-requests.
 *
 * The requester is taken from the access token, not the body, so userId and
 * orgId are deliberately absent here and rejected by the route schema.
 */
export interface CreateHaulingRequestInput {
  requestAddress: string;

  pickupLocations?: HaulingPickupLocation[];

  keepStopOrder?: boolean;

  senderType: SenderType;

  wasteType: HaulingWasteType;

  pickupDate: string;

  imageUrl?: string;

  note?: string;
}

/**
 * An approved hauling request on the caller's route that is scheduled for
 * today's run, returned by GET /hauling-requests/my-route-stops.
 */
export interface HaulingRouteStop {
  requestId: string;
  requestNumber: string;
  wasteType: HaulingWasteType;
  /** One or more pickup addresses joined by new lines, as submitted. */
  requestAddress: string;
  note?: string;
  scheduledCollectionAt: string;
}

/** A truck that can take a Paid route: Active, has a driver and no route. */
export interface AvailablePaidRouteTruck {
  id: string;
  truckNumber: string | null;
  plateNumber: string;
  driverName: string | null;
  /** The truck's branch. Trucks with no branch are not offered. */
  branchId: string;
  wasteType: WasteType;
}

export type HaulingFeasibilityCheckKey = "date" | "truck";

/** "warn" means the request can go ahead, but the admin should look first. */
export type HaulingFeasibilityStatus = "pass" | "warn" | "fail";

export interface HaulingFeasibilityCheck {
  key: HaulingFeasibilityCheckKey;
  label: string;
  status: HaulingFeasibilityStatus;
  message: string;
}

/**
 * Returned by GET /hauling-requests/:id/feasibility. The driving path check
 * runs in the browser, which has the depot and the routing service.
 */
export interface HaulingFeasibilityResult {
  requestId: string;
  /** The preferred pickup day in Philippine time, YYYY-MM-DD. */
  collectionDate: string | null;
  checks: HaulingFeasibilityCheck[];
  availableTrucks: AvailablePaidRouteTruck[];
}

/**
 * Body accepted by POST /hauling-requests/paid-route: a one-time Paid route
 * for a single hauling request. A pending request is approved by it.
 */
export interface CreatePaidHaulingRouteInput {
  requestId: string;
  truckId: string;
  name: string;
  barangay: string;
  /** YYYY-MM-DD. */
  collectionDate: string;
  startTime: string;
  stopLocations: RouteStopLocation[];
}