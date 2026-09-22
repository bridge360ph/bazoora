export type DashboardStopStatus =
  | "DONE"
  | "NOW"
  | "UPCOMING";

export interface DashboardStop {
  stopNumber: string;
  name: string;
  address: string;
  barangay: string;
  wasteType: string;
  status: DashboardStopStatus;
}

export interface DashboardRoute {
  id: string;
  routeNumber: number;
  name: string;
  barangay: string;
  wasteType: string;
  routeStops: DashboardRouteStop[];
}

export interface DashboardRouteStop {
  stopNumber: number;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  status?: string | null;
  completedAt?: string | null;
}

export interface DashboardTruck {
  id: string;
  plateNumber: string;
  status: "active" | "idle";
  currentLocation: {
    lat: number;
    lng: number;
    timestamp: string;
  } | null;
  plannedRoute: DashboardRoute | null;
}

