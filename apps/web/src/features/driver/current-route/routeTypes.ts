export interface RouteStop {
  id: string;
  stopNumber: number;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

export interface AssignedRoute {
  id: string;
  routeNumber: number;
  name: string;
  barangay: string;
  waypoints: string;
  wasteType: string;
  collectionDay: string;
  startTime: string;
  status: string;
  stops: number;
  routeType: string;
  routeStops: RouteStop[];
}

