import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import { geocode } from "@/lib/geocoding";
import type { Route } from "@bazoora/shared";

import type { Stop } from "../types";

interface UseAssignedDriverRouteResult {
  truckId: string | null;
  assignedRoute: Route | null;
  stops: Stop[];
}

interface AssignedTruckResponse {
  success: boolean;
  data?: { id: string } | null;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Cavite municipal centre, used to lay out stops when geocoding is unavailable
// so the dashboard still shows the route in the right part of the map.
const LOCAL_CENTER: [number, number] = [14.3833, 120.8833];

/**
 * Resolves the route the signed-in driver is on, and its stops.
 *
 * Stops come from the route's `waypoints` string, which is the only stop data
 * the Route model carries. This mirrors what the eco-aide route screen already
 * does: split the list, geocode each entry within the Philippines, and fall
 * back to an offset from the municipal centre when a lookup fails.
 */
export function useAssignedDriverRoute(
  accessToken: string | null,
): UseAssignedDriverRouteResult {
  const [truckId, setTruckId] = useState<string | null>(null);
  const [assignedRoute, setAssignedRoute] = useState<Route | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);

  useEffect(() => {
    if (!accessToken || accessToken === "null") {
      setTruckId(null);
      setAssignedRoute(null);
      setStops([]);
      return;
    }

    let cancelled = false;

    const getAssignedRoute = async () => {
      try {
        // The truck is still needed for location sync; the route no longer
        // hangs off it, because /routes/me resolves the driver from the token.
        try {
          const truckResponse =
            await apiClient.get<AssignedTruckResponse>("/trucks/me");

          if (!cancelled) {
            setTruckId(truckResponse.data.data?.id ?? null);
          }
        } catch {
          if (!cancelled) {
            setTruckId(null);
          }
        }

        const routeResponse = await apiClient.get<Route>("/routes/me");
        const route = routeResponse.data;

        if (cancelled) return;

        if (!route) {
          setAssignedRoute(null);
          setStops([]);
          return;
        }

        setAssignedRoute(route);

        const rawStops = route.waypoints
          ? route.waypoints
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

        const resolved: Stop[] = [];

        for (let i = 0; i < rawStops.length; i++) {
          if (cancelled) return;

          const stopName = rawStops[i];
          let lat = LOCAL_CENTER[0] + (i + 1) * 0.0025;
          let lng = LOCAL_CENTER[1] + (i + 1) * 0.0025;

          try {
            // Nominatim asks for no more than one request per second.
            if (i > 0) await sleep(1100);

            let results = await geocode(`${stopName}, ${route.barangay}`, {
              limit: 1,
              countryCodes: "ph",
            });
            let match = results?.[0];

            if (!match) {
              results = await geocode(stopName, {
                limit: 1,
                countryCodes: "ph",
              });
              match = results?.[0];
            }

            if (match?.lat && match?.lon) {
              const parsedLat = Number(match.lat);
              const parsedLng = Number(match.lon);

              if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
                lat = parsedLat;
                lng = parsedLng;
              }
            }
          } catch (err) {
            console.error("Failed to geocode stop:", stopName, err);
          }

          resolved.push({
            stopNumber: String(i + 1).padStart(2, "0"),
            status: i === 0 ? "NOW" : "UPCOMING",
            statusLabel: i === 0 ? "NOW" : "UPCOMING",
            barangay: route.barangay || "Assigned Area",
            name: stopName,
            address: stopName,
            lat,
            lng,
            wasteType: route.wasteType,
            volume: "—",
            priority: "Medium",
          });
        }

        if (!cancelled) setStops(resolved);
      } catch (error) {
        console.error("Failed to fetch assigned route:", error);

        if (!cancelled) {
          setAssignedRoute(null);
          setStops([]);
        }
      }
    };

    void getAssignedRoute();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return { truckId, assignedRoute, stops };
}
