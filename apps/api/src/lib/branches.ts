import {
  BRANCH_LIST,
  nearestBranchId,
  routeBranchId as sharedRouteBranchId,
  type BranchId,
  type BranchInfo,
} from "@bazoora/shared";

function envNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return value !== undefined && value.trim() !== "" && Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * The branches, with the head office moved by DEPOT_NAME, DEPOT_LAT and
 * DEPOT_LNG. Keep these equal to the web app's VITE_DEPOT_* values so both
 * agree on which branch an older route belongs to.
 */
export const BRANCHES: readonly BranchInfo[] = BRANCH_LIST.map((branch) =>
  branch.id === "hq"
    ? {
        ...branch,
        name: process.env.DEPOT_NAME?.trim() || branch.name,
        lat: envNumber(process.env.DEPOT_LAT, branch.lat),
        lng: envNumber(process.env.DEPOT_LNG, branch.lng),
      }
    : branch,
);

export function branchName(id: string | null | undefined): string {
  return BRANCHES.find((branch) => branch.id === id)?.name ?? "an unknown branch";
}

/** The branch closest to the middle of the points, or null without points. */
export function nearestBranch(points: readonly { lat: number; lng: number }[]): BranchId | null {
  return nearestBranchId(points, BRANCHES);
}

/**
 * The branch a route is run from: its saved branch, or for older routes the
 * branch nearest its stops. Null when neither is known.
 */
export function routeBranchId(route: {
  startBranchId: string | null;
  stopLocations: unknown;
}): BranchId | null {
  return sharedRouteBranchId(
    {
      startBranchId: route.startBranchId,
      stopLocations: Array.isArray(route.stopLocations)
        ? (route.stopLocations as { lat: number; lng: number }[])
        : null,
    },
    BRANCHES,
  );
}
