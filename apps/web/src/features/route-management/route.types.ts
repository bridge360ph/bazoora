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
  /** YYYY-MM-DD, used only when routeType is "Paid". */
  collectionDate: string;
  /**
   * The branch the route path starts from: the truck's branch when one is
   * assigned, otherwise the branch the stops were ordered from.
   */
  startBranchId: string | null;
}

export const ROUTE_TYPES = ["Free", "Paid"] as const;

/** "San Lorenzo, City of Makati" becomes "San Lorenzo". */
export function barangayNameOf(label: string): string {
  return label.split(",")[0]?.trim() ?? label.trim();
}

/** "07:00" becomes "7:00 AM". */
export function formatStartTime(value: string): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return value;
  const hours = Number(match[1]);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 === 0 ? 12 : hours % 12}:${match[2]} ${suffix}`;
}

const WASTE_TYPE_NAMES: Record<string, string> = {
  BIODEGRADABLE: "Biodegradable",
  RESIDUAL: "Residual",
  NON_BIODEGRADABLE: "Non-Biodegradable",
  HAZARDOUS: "Hazardous",
};

/**
 * The name of a weekly route, built from what it covers:
 * "San Lorenzo · Biodegradable · Every Monday · 7:00 AM". Empty until the
 * barangay and start time are set. The waste type keeps two routes in the
 * same slot apart, since each waste type has its own truck.
 */
export function buildFreeRouteName(
  barangay: string,
  wasteType: string,
  collectionDay: string,
  startTime: string,
): string {
  if (!barangay.trim() || !startTime.trim()) return "";
  return [
    barangayNameOf(barangay),
    WASTE_TYPE_NAMES[wasteType] ?? wasteType,
    `Every ${collectionDay}`,
    formatStartTime(startTime),
  ].join(" · ");
}

function normalizeBarangay(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function sameBarangay(a: string, b: string): boolean {
  return normalizeBarangay(a) === normalizeBarangay(b);
}

function normalizeTime(value: string): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  return match ? `${match[1]?.padStart(2, "0")}:${match[2]}` : value.trim();
}

/**
 * Another weekly route in the same barangay with the same waste type,
 * collection day and start time, if any. Same rule as the API.
 */
export function findScheduleClash(
  form: Pick<RouteFormValue, "barangay" | "wasteType" | "collectionDay" | "startTime">,
  routes: {
    id: string;
    routeType: string;
    barangay: string;
    wasteType: string;
    collectionDay: string;
    startTime: string;
    routeDisplayNumber: string;
    name: string;
  }[],
  editingRouteId?: string,
) {
  if (!form.barangay.trim() || !form.startTime.trim()) return null;

  return (
    routes.find(
      (route) =>
        route.id !== editingRouteId &&
        route.routeType !== "Paid" &&
        route.wasteType === form.wasteType &&
        route.collectionDay === form.collectionDay &&
        normalizeBarangay(route.barangay) === normalizeBarangay(form.barangay) &&
        normalizeTime(route.startTime) === normalizeTime(form.startTime),
    ) ?? null
  );
}

/**
 * "Every Tuesday" for a Free weekly route, "One-time · Thu, Nov 12, 2026"
 * for a Paid route.
 */
export function describeRouteSchedule(route: {
  routeType: string;
  collectionDay: string;
  collectionDate: string | null;
}): string {
  if (route.routeType === "Paid" && route.collectionDate) {
    const date = new Date(`${route.collectionDate}T00:00:00`);
    const label = Number.isNaN(date.getTime())
      ? route.collectionDate
      : date.toLocaleDateString("en-PH", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        });
    return `One-time · ${label}`;
  }

  return `Every ${route.collectionDay}`;
}