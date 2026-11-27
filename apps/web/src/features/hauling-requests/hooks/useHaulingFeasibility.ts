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
 * Runs the feasibility checks for a request: the driving path in the
 * browser, and the date and truck checks on the API.
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

  const pathQuery = useQuery({
    queryKey: ["hauling-pickup-path", requestId, request?.requestAddress],
    queryFn: () => {
      if (!request) throw new Error("No request selected");
      return checkPickupPath(request);
    },
    enabled: active,
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
        status: pathQuery.isError ? "fail" : "loading",
        message: pathQuery.isError
          ? "The pickup addresses could not be checked."
          : "Finding the stops on the map...",
      };

  const serverRows: FeasibilityRow[] = serverQuery.data
    ? serverQuery.data.checks.map((check: HaulingFeasibilityCheck) => ({ ...check }))
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
    refetch: () => {
      void serverQuery.refetch();
      void pathQuery.refetch();
    },
  };
}

export type HaulingFeasibility = ReturnType<typeof useHaulingFeasibility>;
