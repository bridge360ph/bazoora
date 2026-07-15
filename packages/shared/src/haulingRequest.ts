export type SenderType =
  | "RESIDENT"
  | "BUSINESS";

export type WasteType =
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

  wasteType: WasteType;

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

export interface CreateHaulingRequestInput {
  userId: string;

  orgId?: string;

  requestAddress: string;

  senderType: SenderType;

  wasteType: WasteType;

  pickupDate: string;

  imageUrl?: string;

  note?: string;
}