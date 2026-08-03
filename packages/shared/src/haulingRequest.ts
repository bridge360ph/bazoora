export type SenderType = "Business" | "Resident";

export type HaulingRequestStatus = "pending" | "approved" | "denied";

export interface HaulingRequest {
  requestId: string;

  userId?: string;
  orgId?: string;

  requestAddress: string;
  senderType: SenderType;
  imageUrl?: string;
  pickupDate: string;
  status: HaulingRequestStatus;

  approvedBy?: string;
  approvedAt?: string;
  note?: string;
}

export interface CreateHaulingRequestInput {
  /**
   * Mock value for now.
   * Will become a foreign key reference later.
   */
  userId: string;

  /**
   * Mock value for now.
   * Will become a foreign key reference later.
   */
  orgId: string;

  requestAddress: string;

  senderType: SenderType;

  pickupDate: string;

  imageUrl?: string;

  note?: string;
}