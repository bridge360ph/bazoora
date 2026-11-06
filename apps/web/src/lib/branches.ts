import {
  BRANCH_LIST,
  haversineMeters,
  nearestBranchId,
  type BranchInfo,
} from "@bazoora/shared";
import { env } from "./env";

export { haversineMeters };

export type Branch = BranchInfo;

/**
 * Bazoora branches (truck depots) in Luzon, from @bazoora/shared. The head
 * office comes from VITE_DEPOT_NAME, VITE_DEPOT_LAT and VITE_DEPOT_LNG
 * (default: Makati).
 */
export const BRANCHES: readonly Branch[] = BRANCH_LIST.map((branch) =>
  branch.id === "hq"
    ? { ...branch, name: env.DEPOT_NAME, lat: env.DEPOT_LAT, lng: env.DEPOT_LNG }
    : branch,
);

/** The middle of a set of points. */
export function centroidOf(points: { lat: number; lng: number }[]): { lat: number; lng: number } | null {
  if (points.length === 0) return null;
  const sum = points.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), { lat: 0, lng: 0 });
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
}

/** The branch with this id, or null for an unknown or missing id. */
export function branchById(id: string | null | undefined): Branch | null {
  if (!id) return null;
  return BRANCHES.find((branch) => branch.id === id) ?? null;
}

/**
 * The branch a route is run from: its saved branch, or for older routes the
 * branch nearest its stops. Null when neither is known.
 */
export function routeBranch(route: {
  startBranchId: string | null;
  stopLocations: readonly { lat: number; lng: number }[] | null;
}): Branch | null {
  return (
    branchById(route.startBranchId) ??
    branchById(nearestBranchId(route.stopLocations ?? [], BRANCHES))
  );
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
