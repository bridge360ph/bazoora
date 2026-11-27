import type { CollectionDay, WasteType } from "./route.js";

export type SenderType =
  | "RESIDENT"
  | "BUSINESS";

export type HaulingWasteType =
  | "RESIDUAL"
  | "NON_BIODEGRADABLE"
  | "HAZARDOUS"
  | "BIODEGRADABLE";

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
}

/**
 * Body accepted by POST /hauling-requests.
 *
 * The requester is taken from the access token, not the body, so userId and
 * orgId are deliberately absent here and rejected by the route schema.
 */
export interface CreateHaulingRequestInput {
  requestAddress: string;

  senderType: SenderType;

  wasteType: HaulingWasteType;

  pickupDate: string;

  imageUrl?: string;

  note?: string;
}