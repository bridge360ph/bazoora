import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuthStore } from "@/stores/auth-store";

import type {
  DashboardRoute,
  DashboardStop,
  DashboardTruck,
} from "../driverDashboard.types";

interface TrucksMeResponse {
  success?: boolean;
  data?: DashboardTruck;
}

function mapStops(
  route: DashboardRoute | null,
): DashboardStop[] {
  if (!route?.routeStops) {
    return [];
  }

  return route.routeStops.map(
    (stop, index) => {
      const completed =
        stop.status === "DONE" ||
        Boolean(stop.completedAt);

      const active =
        !completed &&
        index === 0;

      return {
        stopNumber: String(
          stop.stopNumber,
        ).padStart(2, "0"),

        name:
          `Collection Stop ${stop.stopNumber}`,

        address:
          stop.address,

        barangay:
          route.barangay ||
          "Assigned Area",

        wasteType:
          route.wasteType ||
          "Residual",

        status:
          completed
            ? "DONE"
            : active
              ? "NOW"
              : "UPCOMING",
      };
    },
  );
}

export function useDriverDashboardData() {
  const accessToken =
    useAuthStore(
      (state) =>
        state.accessToken,
    );

  const [
    truck,
    setTruck,
  ] =
    useState<DashboardTruck | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      setTruck(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadDashboardData() {
      setLoading(true);

      try {
        const apiUrl =
          import.meta.env
            .VITE_API_URL;

        const response =
          await fetch(
            `${apiUrl}/trucks/me`,
            {
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
            },
          );

        const result =
          (await response.json()) as TrucksMeResponse;

        if (
          cancelled
        ) {
          return;
        }

        if (
          !response.ok ||
          !result.success ||
          !result.data
        ) {
          setTruck(null);
          return;
        }

        setTruck(
          result.data,
        );
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Failed to load Driver Dashboard data:",
            error,
          );

          setTruck(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const assignedRoute =
    truck?.plannedRoute ??
    null;

  const stops =
    useMemo(
      () =>
        mapStops(
          assignedRoute,
        ),
      [assignedRoute],
    );

  const completedCount =
    stops.filter(
      (stop) =>
        stop.status ===
        "DONE",
    ).length;

  const currentStop =
    stops.find(
      (stop) =>
        stop.status ===
        "NOW",
    ) ?? null;

  const nextStop =
    stops.find(
      (stop) =>
        stop.status ===
        "UPCOMING",
    ) ?? null;

  const taskToShow =
    currentStop ??
    nextStop;

  const totalStops =
    stops.length;

  const remainingCount =
    Math.max(
      totalStops -
        completedCount,
      0,
    );

  const progress =
    totalStops > 0
      ? Math.round(
          (completedCount /
            totalStops) *
            100,
        )
      : 0;

  return {
    assignedRoute,
    stops,
    truck,
    loading,

    currentStop,
    nextStop,
    taskToShow,
    hasActiveTask:
      Boolean(
        currentStop,
      ),

    totalStops,
    completedCount,
    remainingCount,
    progress,

    gpsActive:
      Boolean(
        truck?.currentLocation,
      ),
  };
}

