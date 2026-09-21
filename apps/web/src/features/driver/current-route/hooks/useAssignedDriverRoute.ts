import { useEffect, useState } from "react";

import { env } from "@/lib/env";

import type { Stop } from "../types";
import type {
  AssignedRoute,
  RouteStop,
} from "../routeTypes";

interface UseAssignedDriverRouteResult {
  truckId: string | null;
  assignedRoute: AssignedRoute | null;
  stops: Stop[];
}

export function useAssignedDriverRoute(
  accessToken: string | null,
): UseAssignedDriverRouteResult {
  const [truckId, setTruckId] = useState<string | null>(
    null,
  );

  const [assignedRoute, setAssignedRoute] =
    useState<AssignedRoute | null>(null);

  const [stops, setStops] = useState<Stop[]>([]);

  useEffect(() => {
    if (!accessToken || accessToken === "null") {
      return;
    }

    const getMyTruck = async () => {
      try {
        const response = await fetch(
          `${env.VITE_API_URL}/trucks/me`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        const json = await response.json();

        if (
          !response.ok ||
          !json.success ||
          !json.data
        ) {
          console.error(
            "Failed to fetch assigned truck:",
            json,
          );

          return;
        }

        const truck = json.data;

        setTruckId(truck.id);

        const route = truck.plannedRoute;

        if (!route || Array.isArray(route)) {
          setAssignedRoute(null);
          setStops([]);
          return;
        }

        setAssignedRoute(route);

        const databaseStops: RouteStop[] =
          Array.isArray(route.routeStops)
            ? route.routeStops
            : [];

        const mappedStops: Stop[] =
          databaseStops
            .filter(
              (stop) =>
                typeof stop.latitude === "number" &&
                typeof stop.longitude === "number",
            )
            .map((stop, index) => ({
              stopNumber: String(
                stop.stopNumber,
              ).padStart(2, "0"),

              status:
                index === 0
                  ? "NOW"
                  : "UPCOMING",

              statusLabel:
                index === 0
                  ? "NOW"
                  : "UPCOMING",

              barangay:
                route.barangay ||
                "Assigned Area",

              name:
                `Collection Stop ${stop.stopNumber}`,

              address: stop.address,

              lat:
                stop.latitude as number,

              lng:
                stop.longitude as number,

              wasteType:
                route.wasteType ===
                  "Hazardous" ||
                route.wasteType ===
                  "Non-Bio" ||
                route.wasteType ===
                  "Biodegradable"
                  ? route.wasteType
                  : "Residual",

              volume: "—",

              priority: "Medium",
            }));

        setStops(mappedStops);
      } catch (error) {
        console.error(
          "Failed to fetch assigned truck:",
          error,
        );

        setAssignedRoute(null);
        setStops([]);
      }
    };

    void getMyTruck();
  }, [accessToken]);

  return {
    truckId,
    assignedRoute,
    stops,
  };
}

