export type SenderFilter = "All" | "Residents" | "Business";

export type WasteFilter = "All" | "Recyclable" | "Regular/Non-Recyclable";

export type WasteType = "Recyclable" | "Regular/Non-Recyclable";

export type RequestSender = "Business" | "Resident";

export type HaulingRequestStatus = "Pending" | "Approved" | "Denied";

export interface HaulingRequest {
  id: string;
  location: string;
  fullLocation: string;
  wasteType: WasteType;
  sentBy: RequestSender;
  sentByName: string;
  feeClassification: string;
  dateRequested: string;
  dateNeeded: string;
  status: HaulingRequestStatus;
  assignedEcoAide?: string;
  denialReason?: string;
}