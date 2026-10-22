export type IncidentStatus =
  | "PENDING"
  | "INVESTIGATING"
  | "RESOLVED"
  | "DENIED";

export interface CreateIncidentReportInput {
  category: string;
  description: string;
  routeId?: string;
  stopName?: string;
  imageUrl?: string;
}

export interface IncidentReport {
  id: string;
  reportNumber: string;
  reporterId: string;
  reporterName?: string;
  routeId?: string;
  stopName?: string;
  category: string;
  description: string;
  imageUrl?: string;
  status: IncidentStatus;
  adminNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PresignedUploadUrlRequest {
  fileName: string;
  fileType: string;
}

export interface PresignedUploadUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}