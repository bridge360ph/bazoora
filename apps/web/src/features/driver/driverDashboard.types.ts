export type DashboardStopStatus =
  | "DONE"
  | "NOW"
  | "UPCOMING";

export type DashboardRouteStop = {
  id: string;
  stopNumber: number;
  address: string;
  latitude: number | null;
  longitude: number | null;
};

export type DashboardRoute = {
  id: string;
  routeNumber: number;
  name: string;
  barangay: string;
  wasteType: string;
  collectionDay: string;
  startTime: string;
  status: string | null;
  stops: number;
  routeType: string;
  routeStops: DashboardRouteStop[];
};

export type DashboardTruckLocation = {
  lat: number;
  lng: number;
  timestamp: string;
};

export type DashboardTruck = {
  id: string;
  plateNumber: string;
  model?: string | null;
  capacity?: string | null;
  status: string;

  currentLocation:
    | DashboardTruckLocation
    | null;

  plannedRoute?: unknown[];

  assignedDriver?: string | null;

  assignedDriverId?: string | null;
};

export type DashboardStop = {
  stopNumber: string;
  name: string;
  address: string;
  barangay: string;
  wasteType: string;
  status: DashboardStopStatus;
};