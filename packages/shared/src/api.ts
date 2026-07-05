/** Response shape returned by the backend health-check endpoint (`GET /`). */
export interface HealthResponse {
  status: string;
}

export interface HaulingRequest {
  requestId: string;
  requestAddress: string;
  senderType: "Business" | "Resident";
  pickupDate: string;
  imageUrl?: string;
  note?: string;
  status: "pending" | "approved" | "denied";
}

export type SenderType = "Business" | "Resident";

export interface CreateHaulingRequestInput {
  requestAddress: string;
  senderType: SenderType;
  pickupDate: string;
  imageUrl?: string;
  note?: string;
}