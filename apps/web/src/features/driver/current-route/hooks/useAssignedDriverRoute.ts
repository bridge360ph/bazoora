import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import { geocode } from "@/lib/geocoding";
import type { Route } from "@bazoora/shared";

import type { Stop } from "../types";

interface UseAssignedDriverRouteResult {
  truckId: string | null;
  assignedRoute: Route | null;
  stops: Stop[];
  /** Waypoints we could not place on the map, by name, so the screen can say so. */
  unlocatedStops: string[];
}

interface AssignedTruckResponse {
  success: boolean;
  data?: { id: string } | null;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Resolves the route the signed-in driver is on, and its stops.
 *
 * Stops come from the route's `waypoints` string, which is the only stop data
 * the Route model carries: split the list and geocode each entry within the
 * Philippines.
 *
 * A waypoint we cannot geocode is returned by name in `unlocatedStops` and
 * kept out of `stops` entirely. It must never be given a placed-looking
 * position: these coordinates drive the turn-by-turn line, the distance and
 * ETA readout, and the proximity check that unlocks marking a stop collected,
 * so a made-up point sends a driver to the wrong place and lets them complete
 * a collection they never made.
 */
export function useAssignedDriverRoute(
  accessToken: string | null,
): UseAssignedDriverRouteResult {
  const [truckId, setTruckId] = useState<string | null>(null);
  const [assignedRoute, setAssignedRoute] = useState<Route | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [unlocatedStops, setUnlocatedStops] = useState<string[]>([]);

  useEffect(() => {
    if (!accessToken || accessToken === "null") {
      setTruckId(null);
      setAssignedRoute(null);
      setStops([]);
      setUnlocatedStops([]);
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
          setUnlocatedStops([]);
          return;
        }

        setAssignedRoute(route);

        // Routes saved with map positions are used as is, with no lookups.
        if (route.stopLocations && route.stopLocations.length > 0) {
          setStops(
            route.stopLocations.map((stop, i) => ({
              stopNumber: String(i + 1).padStart(2, "0"),
              status: i === 0 ? "NOW" : "UPCOMING",
              statusLabel: i === 0 ? "NOW" : "UPCOMING",
              barangay: route.barangay || "Assigned Area",
              name: stop.name,
              address: stop.address || stop.name,
              lat: stop.lat,
              lng: stop.lng,
              wasteType: route.wasteType,
              volume: "—",
              priority: "Medium",
            })),
          );
          return;
        }

        const rawStops = route.waypoints
          ? route.waypoints
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

        const resolved: Stop[] = [];
        const unlocated: string[] = [];

        for (let i = 0; i < rawStops.length; i++) {
          if (cancelled) return;

          const stopName = rawStops[i];
          let position: { lat: number; lng: number } | null = null;

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

              if (Number.isFinite(parsedLat) && Number.isFinite(parsedLng)) {
                position = { lat: parsedLat, lng: parsedLng };
              }
            }
          } catch (err) {
            console.error("Failed to geocode stop:", stopName, err);
          }

          if (!position) {
            unlocated.push(stopName);
            continue;
          }

          // Numbered off what we actually placed, so the list stays contiguous
          // when a waypoint in the middle could not be geocoded.
          const isFirst = resolved.length === 0;

          resolved.push({
            stopNumber: String(resolved.length + 1).padStart(2, "0"),
            status: isFirst ? "NOW" : "UPCOMING",
            statusLabel: isFirst ? "NOW" : "UPCOMING",
            barangay: route.barangay || "Assigned Area",
            name: stopName,
            address: stopName,
            lat: position.lat,
            lng: position.lng,
            wasteType: route.wasteType,
            volume: "—",
            priority: "Medium",
          });
        }

        if (!cancelled) {
          setStops(resolved);
          setUnlocatedStops(unlocated);
        }
      } catch (error) {
        console.error("Failed to fetch assigned route:", error);

        if (!cancelled) {
          setAssignedRoute(null);
          setStops([]);
          setUnlocatedStops([]);
        }
      }
    };

    void getAssignedRoute();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return { truckId, assignedRoute, stops, unlocatedStops };
}
