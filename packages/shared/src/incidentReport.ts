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
  routeName?: string;
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

/**
 * Admin update to an incident report. Send at least one field. A report that
 * is RESOLVED or DENIED is closed: its status can no longer change, but its
 * admin notes can still be edited.
 */
export interface UpdateIncidentReportInput {
  status?: IncidentStatus;
  /** An empty string clears the notes. */
  adminNotes?: string;
}

export interface IncidentReportFilters {
  status?: IncidentStatus;
  category?: string;
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