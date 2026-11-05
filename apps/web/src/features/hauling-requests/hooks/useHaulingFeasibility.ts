import { useQuery } from "@tanstack/react-query";
import type {
  HaulingFeasibilityCheck,
  HaulingFeasibilityStatus,
  HaulingRequest,
} from "@bazoora/shared";

import { checkPickupPath, fetchHaulingFeasibility } from "../feasibilityApi";

export interface FeasibilityRow {
  key: string;
  label: string;
  status: HaulingFeasibilityStatus | "loading";
  message: string;
}

/**
 * Runs the feasibility checks for a request: the date and free trucks on
 * the API, then in the browser the driving path from the nearest free
 * truck's branch, which also decides the truck check.
 * Nothing runs until `enabled` is true.
 */
export function useHaulingFeasibility(
  request: HaulingRequest | null,
  enabled: boolean,
) {
  const requestId = request?.requestId ?? "";
  const active = enabled && request !== null;

  const serverQuery = useQuery({
    queryKey: ["hauling-feasibility", requestId],
    queryFn: () => fetchHaulingFeasibility(requestId),
    enabled: active,
    staleTime: 0,
  });

  // Waits for the free trucks, so the path starts from the nearest one.
  const trucks = serverQuery.data?.availableTrucks;
  const pathQuery = useQuery({
    queryKey: [
      "hauling-pickup-path",
      requestId,
      request?.requestAddress,
      (trucks ?? []).map((truck) => `${truck.id}:${truck.branchId}`).join(","),
    ],
    queryFn: () => {
      if (!request) throw new Error("No request selected");
      return checkPickupPath(request, trucks ?? []);
    },
    enabled: active && trucks !== undefined,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const pathRow: FeasibilityRow = pathQuery.data
    ? {
        key: "path",
        label: "Driving path",
        status: pathQuery.data.status,
        message: pathQuery.data.message,
      }
    : {
        key: "path",
        label: "Driving path",
        status: pathQuery.isError || serverQuery.isError ? "fail" : "loading",
        message: pathQuery.isError
          ? "The pickup addresses could not be checked."
          : serverQuery.isError
            ? "The driving path needs the free trucks, which could not be loaded."
            : "Finding the stops on the map...",
      };

  const truckCheck = pathQuery.data?.truckCheck ?? null;
  const serverRows: FeasibilityRow[] = serverQuery.data
    ? serverQuery.data.checks.map((check: HaulingFeasibilityCheck): FeasibilityRow => {
        if (check.key !== "truck" || check.status === "fail") return { ...check };
        // A free truck exists: wait for its drive time before passing.
        if (truckCheck) return { ...check, ...truckCheck };
        return pathQuery.data
          ? { ...check }
          : { ...check, status: "loading", message: "Finding the nearest free truck..." };
      })
    : [
        {
          key: "server",
          label: "Date and truck",
          status: serverQuery.isError ? "fail" : "loading",
          message: serverQuery.isError
            ? serverQuery.error.message
            : "Checking the schedule and fleet...",
        },
      ];

  const rows = [pathRow, ...serverRows];
  const isChecking = rows.some((row) => row.status === "loading");
  const hasFailure = rows.some((row) => row.status === "fail");
  const hasWarning = rows.some((row) => row.status === "warn");

  return {
    rows,
    isChecking,
    hasFailure,
    hasWarning,
    result: serverQuery.data ?? null,
    pickupStops: pathQuery.data?.stops ?? null,
    /** The free truck with the shortest drive to the pickup. */
    recommendedTruckId: pathQuery.data?.recommendedTruckId ?? null,
    /** Free truck ids, nearest first. */
    truckOrder: pathQuery.data?.truckOrder ?? [],
    refetch: () => {
      void serverQuery.refetch();
      void pathQuery.refetch();
    },
  };
}

export type HaulingFeasibility = ReturnType<typeof useHaulingFeasibility>;
