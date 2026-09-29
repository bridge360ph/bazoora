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
      setTruckId(null);
      setAssignedRoute(null);
      setStops([]);
      return;
    }

    const getAssignedRoute = async () => {
      try {
        const truckResponse = await fetch(
          `${env.VITE_API_URL}/trucks/me`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        const truckJson = await truckResponse.json();

        if (
          !truckResponse.ok ||
          !truckJson.success ||
          !truckJson.data
        ) {
          setTruckId(null);
          setAssignedRoute(null);
          setStops([]);
          return;
        }

        const truck = truckJson.data;

        setTruckId(truck.id);

        const routeResponse = await fetch(
          `${env.VITE_API_URL}/routes/truck/${truck.id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        const routeJson = await routeResponse.json();

        if (
          !routeResponse.ok ||
          !routeJson.success
        ) {
          console.error(
            "Failed to fetch assigned route:",
            routeJson,
          );

          setAssignedRoute(null);
          setStops([]);
          return;
        }

        const route =
          routeJson.data as AssignedRoute | null;

        if (!route) {
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

              lat: stop.latitude as number,

              lng: stop.longitude as number,

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
          "Failed to fetch assigned route:",
          error,
        );

        setTruckId(null);
        setAssignedRoute(null);
        setStops([]);
      }
    };

    void getAssignedRoute();
  }, [accessToken]);

  return {
    truckId,
    assignedRoute,
    stops,
  };
}