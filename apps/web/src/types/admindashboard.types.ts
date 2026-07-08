// ---------------------------------------------------------------------------
// dashboard.types.ts
//
// Local UI types for the admin dashboard.
// API contract types (shapes returned by the backend) live in @bazoora/shared.
// These types are for UI-layer concerns only — display state, derived values,
// and props that have no equivalent in the shared package.
// ---------------------------------------------------------------------------

export type EcoAideAvailability = "available" | "on-route" | "off-duty";

export interface DashboardEcoAide {
  id: string;
  name: string;
  availability: EcoAideAvailability;
}

export type RequestStatus = "pending" | "approved" | "denied";

export interface DashboardRequest {
  id: string;
  location: string;
  wasteType: string;
  status: RequestStatus;
  /** Undefined means unassigned */
  assignedEcoAide?: string;
}

export interface RouteStatusSummary {
  inProgress: number;
  notStarted: number;
  completedToday: number;
  totalRoutes: number;
}

export interface DashboardStats {
  activePickups: number;
  unassignedRequests: number;
}