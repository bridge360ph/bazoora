import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { env } from "@/lib/env";
import { useAuthStore } from "@/stores/auth-store";

import {
  useAssignedDriverRoute,
} from "../current-route/hooks/useAssignedDriverRoute";

import type { Stop } from "../current-route/types";

interface DriverTruck {
  id: string;
  plateNumber?: string | null;
  status?: string | null;
  currentLocation?: {
    lat: number;
    lng: number;
    timestamp?: string;
  } | null;
}

export function useDriverDashboardData() {
  const accessToken =
    useAuthStore(
      (state) =>
        state.accessToken,
    );

  const {
    assignedRoute,
    stops,
  } =
    useAssignedDriverRoute(
      accessToken,
    );

  const [truck, setTruck] =
    useState<DriverTruck | null>(
      null,
    );

  const [
    truckLoading,
    setTruckLoading,
  ] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      setTruck(null);
      setTruckLoading(false);
      return;
    }

    let cancelled = false;

    const loadTruck =
      async () => {
        setTruckLoading(true);

        try {
          const response =
            await fetch(
              `${env.VITE_API_URL}/trucks/me`,
              {
                headers: {
                  Authorization:
                    `Bearer ${accessToken}`,
                },
              },
            );

          const result =
            (await response.json()) as {
              success?: boolean;
              data?: DriverTruck;
            };

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
              "Failed to load driver truck:",
              error,
            );

            setTruck(null);
          }
        } finally {
          if (!cancelled) {
            setTruckLoading(
              false,
            );
          }
        }
      };

    void loadTruck();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const completedStops =
    useMemo(
      () =>
        stops.filter(
          (stop) =>
            stop.status ===
            "DONE",
        ),
      [stops],
    );

  const currentStop =
    useMemo(
      () =>
        stops.find(
          (stop) =>
            stop.status ===
            "NOW",
        ) ?? null,
      [stops],
    );

  const nextStop =
    useMemo(
      () =>
        stops.find(
          (stop) =>
            stop.status ===
            "UPCOMING",
        ) ?? null,
      [stops],
    );

  const totalStops =
    stops.length;

  const completedCount =
    completedStops.length;

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

  const taskToShow =
    currentStop ??
    nextStop;

  const hasActiveTask =
    Boolean(currentStop);

  const truckStatus =
    truck?.status
      ?.toLowerCase() ?? "";

  const gpsActive =
    Boolean(
      truck?.currentLocation,
    );

  return {
    assignedRoute,
    stops,

    truck,
    truckLoading,
    truckStatus,
    gpsActive,

    completedStops,
    currentStop,
    nextStop,
    taskToShow,
    hasActiveTask,

    totalStops,
    completedCount,
    remainingCount,
    progress,
  };
}

export type DriverDashboardData =
  ReturnType<
    typeof useDriverDashboardData
  >;

export type DashboardStop =
  Stop;

