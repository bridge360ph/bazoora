import { env } from "./env";

export interface Branch {
  id: string;
  name: string;
  /** The city or municipality, used in messages. */
  city: string;
  lat: number;
  lng: number;
}

/**
 * Bazoora truck depots.
 *
 * Only the one depot we actually operate is listed, taken from
 * VITE_DEPOT_NAME, VITE_DEPOT_LAT and VITE_DEPOT_LNG (default: Makati).
 *
 * This was previously a hardcoded list of 27 cities across Luzon, which were
 * not real depots: they had no backing record anywhere, yet the planner chose
 * between them and the admin was shown driving distances and durations
 * measured from whichever one it picked. Add entries here only for depots
 * that exist, and prefer moving this to the database once there is more than
 * one, so operations can add a depot without a deploy.
 */
export const BRANCHES: readonly Branch[] = [
  {
    id: "hq",
    name: env.DEPOT_NAME,
    city: "Makati",
    lat: env.DEPOT_LAT,
    lng: env.DEPOT_LNG,
  },
];

export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

/** The middle of a set of points. */
export function centroidOf(points: { lat: number; lng: number }[]): { lat: number; lng: number } | null {
  if (points.length === 0) return null;
  const sum = points.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), { lat: 0, lng: 0 });
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
}

/** Branches closest to the stops in a straight line, nearest first. */
export function nearestBranches(
  points: { lat: number; lng: number }[],
  count = 3,
): Branch[] {
  const centre = centroidOf(points);
  if (!centre) return BRANCHES.slice(0, 1);

  return [...BRANCHES]
    .sort((a, b) => haversineMeters(a, centre) - haversineMeters(b, centre))
    .slice(0, count);
}
