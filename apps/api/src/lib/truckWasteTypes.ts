import { BRANCH_IDS, branchName, routeBranchId, type WasteType } from "@bazoora/shared";

export const WASTE_TYPE_VALUES: readonly WasteType[] = [
  "BIODEGRADABLE",
  "RESIDUAL",
  "NON_BIODEGRADABLE",
  "HAZARDOUS",
];

const WASTE_TYPE_LABELS: Record<WasteType, string> = {
  BIODEGRADABLE: "Biodegradable",
  RESIDUAL: "Residual",
  NON_BIODEGRADABLE: "Non-biodegradable",
  HAZARDOUS: "Hazardous",
};

export function wasteTypeLabel(wasteType: string): string {
  return WASTE_TYPE_LABELS[wasteType as WasteType] ?? wasteType;
}

/** Truck.wasteType is plain text, so an unknown value is sent as null. */
export function toWasteType(value: string | null): WasteType | null {
  return WASTE_TYPE_VALUES.find((wasteType) => wasteType === value) ?? null;
}

/** Each truck carries one waste type. */
export function truckCarries(
  truck: { wasteType: string | null },
  wasteType: string,
): boolean {
  return truck.wasteType === wasteType;
}

/** The message shown when a truck does not carry a route's waste type. */
export function wasteTypeMismatchMessage(wasteType: string): string {
  return `This truck does not carry ${wasteTypeLabel(wasteType)} waste. Choose a truck set up for it, or add the waste type to the truck in Fleet Management.`;
}

/**
 * A weekly (Free) route is served by trucks from the branch it starts from.
 * Returns the reason a truck cannot take the route, or null when it can.
 * Paid routes are planned from the truck's own branch, so any branch works.
 * Older routes with no saved branch use the branch nearest their stops.
 */
export function branchMismatchReason(
  truck: { branchId: string | null },
  route: { routeType: string; startBranchId: string | null; stopLocations: unknown },
): string | null {
  if (route.routeType === "Paid") return null;

  if (!truck.branchId) {
    return "This truck has no branch yet. Set its branch in Fleet Management first.";
  }

  const routeBranch = routeBranchId({
    startBranchId: route.startBranchId,
    stopLocations: Array.isArray(route.stopLocations)
      ? (route.stopLocations as { lat: number; lng: number }[])
      : null,
  });

  if (!routeBranch) {
    return "This route has no branch yet. Place its stops on the map in Route Management and save it first.";
  }

  if (routeBranch !== truck.branchId) {
    return `This route is run from ${branchName(routeBranch)}, but the truck is from ${branchName(truck.branchId)}. Pick a truck from ${branchName(routeBranch)}.`;
  }

  return null;
}

/** JSON schema pieces shared by the truck and route bodies. */
export const branchIdSchema = { type: "string", enum: [...BRANCH_IDS] } as const;

export const wasteTypeSchema = { type: "string", enum: [...WASTE_TYPE_VALUES] } as const;
