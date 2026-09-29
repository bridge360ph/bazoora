import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuthStore } from "@/stores/auth-store";

import type {
  DashboardRoute,
  DashboardRouteStop,
  DashboardStop,
  DashboardStopStatus,
  DashboardTruck,
} from "../driverDashboard.types";

interface TrucksMeResponse {
  success?: boolean;
  data?: DashboardTruck;
}

interface AssignedRouteResponse {
  success?: boolean;
  data?: {
    id: string;
    routeNumber: number;
    name: string;
    barangay: string;
    wasteType: string;
    status?: string | null;
    routeStops?: DashboardRouteStop[];
  } | null;
}

function mapStops(
  route: DashboardRoute | null,
): DashboardStop[] {
  if (!route?.routeStops) {
    return [];
  }

  const sortedStops = [
    ...route.routeStops,
  ].sort(
    (a, b) =>
      a.stopNumber -
      b.stopNumber,
  );

  let nextIncompleteFound = false;

  return sortedStops.map(
    (stop) => {
      const completed =
        stop.status === "DONE" ||
        Boolean(stop.completedAt);

      let status: DashboardStopStatus;

      if (completed) {
        status = "DONE";
      } else if (
        !nextIncompleteFound
      ) {
        status = "NOW";
        nextIncompleteFound = true;
      } else {
        status = "UPCOMING";
      }

      return {
        stopNumber:
          String(
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

        status,
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
    assignedRoute,
    setAssignedRoute,
  ] =
    useState<DashboardRoute | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      setTruck(null);
      setAssignedRoute(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadDashboardData() {
      try {
        const apiUrl =
          import.meta.env
            .VITE_API_URL;

        const truckResponse =
          await fetch(
            `${apiUrl}/trucks/me`,
            {
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
            },
          );

        const truckResult =
          (await truckResponse.json()) as TrucksMeResponse;

        if (cancelled) {
          return;
        }

        if (
          !truckResponse.ok ||
          !truckResult.success ||
          !truckResult.data
        ) {
          setTruck(null);
          setAssignedRoute(null);
          return;
        }

        const currentTruck =
          truckResult.data;

        setTruck(
          currentTruck,
        );

        if (!currentTruck.id) {
          setAssignedRoute(null);
          return;
        }

        const routeResponse =
          await fetch(
            `${apiUrl}/routes/truck/${currentTruck.id}`,
            {
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
            },
          );

        const routeResult =
          (await routeResponse.json()) as AssignedRouteResponse;

        if (cancelled) {
          return;
        }

        if (
          !routeResponse.ok ||
          !routeResult.success ||
          !routeResult.data
        ) {
          setAssignedRoute(null);
          return;
        }

        const route =
          routeResult.data;

        setAssignedRoute({
          id:
            route.id,

          routeNumber:
            route.routeNumber,

          name:
            route.name,

          barangay:
            route.barangay,

          wasteType:
            route.wasteType,

          status:
            route.status,

          routeStops:
            route.routeStops ??
            [],
        });
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Failed to load Driver Dashboard data:",
            error,
          );

          setTruck(null);
          setAssignedRoute(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    setLoading(true);

    void loadDashboardData();

    const refreshInterval =
      window.setInterval(
        () => {
          void loadDashboardData();
        },
        5000,
      );

    return () => {
      cancelled = true;

      window.clearInterval(
        refreshInterval,
      );
    };
  }, [accessToken]);

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

  const hasActiveTask =
    Boolean(
      currentStop,
    );

  const routeInProgress =
    Boolean(
      assignedRoute &&
      (
        truck?.status ===
          "active" ||
        assignedRoute.status ===
          "In Progress"
      ),
    );

  return {
    assignedRoute,
    stops,
    truck,
    loading,

    currentStop,
    nextStop,
    taskToShow,

    hasActiveTask,

    totalStops,
    completedCount,
    remainingCount,
    progress,

    routeInProgress,

    gpsActive:
      Boolean(
        truck?.currentLocation,
      ),
  };
}