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

  createdAt?: string;
  updatedAt?: string;
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