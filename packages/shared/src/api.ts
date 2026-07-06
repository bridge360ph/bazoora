/** Response shape returned by the backend health-check endpoint (`GET /`). */
export interface HealthResponse {
  status: string;
}

export type SenderType = "Business" | "Resident";

export type HaulingRequestStatus = "pending" | "approved" | "denied";

export interface HaulingRequest {
  requestId: string;

  /**
   * Placeholder until User module is integrated.
   * Will eventually reference users.user_id.
   */
  userId: string;

  /**
   * Placeholder until Organization module is integrated.
   * Will eventually reference organizations.org_id.
   */
  orgId: string;

  requestAddress: string;

  /**
   * May eventually be derived from user information.
   */
  senderType: SenderType;

  imageUrl?: string;

  pickupDate: string;

  status: HaulingRequestStatus;

  /**
   * Placeholder until authentication/admin roles are implemented.
   */
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