import type {
  CollectionDay,
  WasteType,
  RouteStatus,
  RouteStopLocation,
} from "@bazoora/shared";

export type { RouteStatus };

export type RouteStatusFilter =
  | "All"
  | RouteStatus;

/**
 * A stop in the route form. lat/lng are null for stops carried over from a
 * route made before stops were placed on a map, until they are located.
 */
export interface EditableRouteStop {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
}

export function isLocatedStop(
  stop: EditableRouteStop,
): stop is EditableRouteStop & { lat: number; lng: number } {
  return stop.lat !== null && stop.lng !== null;
}

export function toStopLocations(stops: EditableRouteStop[]): RouteStopLocation[] {
  return stops.filter(isLocatedStop).map((stop) => ({
    name: stop.name.trim(),
    address: stop.address,
    lat: stop.lat,
    lng: stop.lng,
  }));
}

/** Same rule as the API: commas inside a name would split it into two stops. */
export function waypointsFromStops(stops: EditableRouteStop[]): string {
  return stops
    .map((stop) => stop.name.replace(/,/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(", ");
}

export interface RouteFormValue {
  name: string;
  barangay: string;
  waypoints: string;
  wasteType: WasteType;
  collectionDay: CollectionDay;
  startTime: string;
  routeType: string;
  assignedEcoAideId: string | null;
  /**
   * Picked in the form but saved through PATCH /routes/:id/assign-truck,
   * so it is stripped before the create and update requests.
   */
  assignedTruckId: string | null;
  /**
   * The stops being edited. Turned into `waypoints` and `stopLocations`
   * when the route is saved; never sent as is.
   */
  stops: EditableRouteStop[];
}