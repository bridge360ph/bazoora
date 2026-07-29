interface RouteRecord {
  id: string;
  routeNumber: number;
  name: string;
  barangay: string;
  waypoints: string;
  wasteType: string;
  collectionDay: string;
  startTime: string;
  status: string;
}


export function mapRouteToResponse(
  route: RouteRecord,
) {
  return {
    id: route.id,
    routeNumber: route.routeNumber,
    name: route.name,
    barangay: route.barangay,
    waypoints: route.waypoints,
    wasteType: route.wasteType,
    collectionDay: route.collectionDay,
    startTime: route.startTime,
    status: route.status,
  };
}