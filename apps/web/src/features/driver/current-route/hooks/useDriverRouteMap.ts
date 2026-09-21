import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  MapMarker,
  MapRoute,
} from "@/components/map/smart-map";

import type {
  RouteStep,
} from "@/lib/routing";

import type {
  Stop,
} from "../types";

interface DirectionsResponse {
  routes?: DirectionsRoute[];
}

interface DirectionsRoute {
  distance: number;
  duration: number;
  legs?: {
    steps: RouteStep[];
  }[];
}

interface UseDriverRouteMapProps {
  gpsPos:
    | [number, number]
    | null;

  heading: number;

  stops: Stop[];

  isPlanning: boolean;

  isCollecting: boolean;

  routePath?: [number, number][];
}

export function useDriverRouteMap({
  gpsPos,
  heading,
  stops,
  isPlanning,
  isCollecting,
}: UseDriverRouteMapProps) {
  const [
    navigationSteps,
    setNavigationSteps,
  ] = useState<RouteStep[]>([]);

  const [
    routeSummary,
    setRouteSummary,
  ] = useState<
    | {
        distance: number;
        duration: number;
      }
    | undefined
  >(undefined);

  /*
   * ---------------- MAP CENTER
   */

  const mapCenter =
    useMemo<
      [number, number] | undefined
    >(() => {
      if (
        gpsPos &&
        Number.isFinite(
          gpsPos[0],
        ) &&
        Number.isFinite(
          gpsPos[1],
        )
      ) {
        return gpsPos;
      }

      const activeStop =
        stops.find(
          (stop) =>
            stop.status ===
            "NOW",
        );

      if (
        activeStop &&
        Number.isFinite(
          activeStop.lat,
        ) &&
        Number.isFinite(
          activeStop.lng,
        )
      ) {
        return [
          activeStop.lat,
          activeStop.lng,
        ];
      }

      const firstStop =
        stops[0];

      if (
        firstStop &&
        Number.isFinite(
          firstStop.lat,
        ) &&
        Number.isFinite(
          firstStop.lng,
        )
      ) {
        return [
          firstStop.lat,
          firstStop.lng,
        ];
      }

      return undefined;
    }, [gpsPos, stops]);

  /*
   * ---------------- MARKERS
   */

  const mapMarkers =
    useMemo<MapMarker[]>(() => {
      return [
        ...(gpsPos
          ? [
              {
                id: "truck-main",

                position: [
                  gpsPos[0],
                  gpsPos[1],
                ] as [
                  number,
                  number,
                ],

                label:
                  "Current Location",

                icon:
                  "truck" as const,

                pulse:
                  isCollecting,

                heading,
              },
            ]
          : []),

        ...stops.map(
          (stop, index) => ({
            id: `stop-${stop.stopNumber || index + 1}`,

            position: [
              stop.lat,
              stop.lng,
            ] as [
              number,
              number,
            ],

            label: stop.name,

            icon:
              stop.status ===
              "DONE"
                ? ("done" as const)
                : ("stop" as const),

            stopNumber:
              Number(
                stop.stopNumber,
              ),

            pulse:
              stop.status ===
                "NOW" &&
              isCollecting,
          }),
        ),
      ];
    }, [
      gpsPos,
      stops,
      heading,
      isCollecting,
    ]);

  /*
   * ---------------- ROUTE
   *
   * One MapRoute for the complete
   * collection route.
   *
   * While collecting:
   *
   * Current GPS
   *     ↓
   * Stop 1
   *     ↓
   * Stop 2
   *     ↓
   * Stop 3
   *
   * Completed stops are removed.
   */

  const mapRoutes =
    useMemo<MapRoute[]>(() => {
      if (
        stops.length === 0
      ) {
        return [];
      }

      const remainingStops =
        stops.filter(
          (stop) =>
            stop.status !==
            "DONE",
        );

      const activeStops =
        remainingStops.length >
        0
          ? remainingStops
          : stops;

      const waypoints: [
        number,
        number,
      ][] = [
        ...(gpsPos &&
        isCollecting
          ? [
              [
                gpsPos[1],
                gpsPos[0],
              ] as [
                number,
                number,
              ],
            ]
          : []),

        ...activeStops.map(
          (stop) =>
            [
              Number(
                stop.lng,
              ),
              Number(
                stop.lat,
              ),
            ] as [
              number,
              number,
            ],
        ),
      ];

      if (
        waypoints.length < 2
      ) {
        return [];
      }

      return [
        {
          waypoints,

          color: "green",

          label:
            "Driver Route",
        },
      ];
    }, [
      gpsPos,
      stops,
      isCollecting,
    ]);

  /*
   * ---------------- MAPBOX DIRECTIONS
   *
   * Used for:
   * - ETA
   * - remaining distance
   * - remaining duration
   * - turn-by-turn instructions
   */

  useEffect(() => {
    let cancelled = false;

    async function loadRoute() {
      if (
        !gpsPos ||
        stops.length === 0 ||
        isPlanning
      ) {
        return;
      }

      try {
        const remainingStops =
          stops.filter(
            (stop) =>
              stop.status !==
              "DONE",
          );

        const activeStops =
          remainingStops.length >
          0
            ? remainingStops
            : stops;

        const points = [
          [
            gpsPos[1],
            gpsPos[0],
          ],
          ...activeStops.map(
            (stop) => [
              Number(
                stop.lng,
              ),
              Number(
                stop.lat,
              ),
            ],
          ),
        ];

        const coords = points
          .map(
            (point) =>
              point.join(","),
          )
          .join(";");

        const accessToken =
          import.meta.env
            .VITE_MAPBOX_ACCESS_TOKEN;

        if (!accessToken) {
          console.error(
            "VITE_MAPBOX_ACCESS_TOKEN is not configured.",
          );

          return;
        }

        const url =
          `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}` +
          `?steps=true` +
          `&geometries=geojson` +
          `&overview=full` +
          `&access_token=${accessToken}`;

        const response =
          await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Mapbox request failed: ${response.status}`,
          );
        }

        const data =
          (await response.json()) as DirectionsResponse;

        if (cancelled) {
          return;
        }

        const route =
          data.routes?.[0];

        if (!route) {
          setRouteSummary(
            undefined,
          );

          setNavigationSteps(
            [],
          );

          return;
        }

        setRouteSummary({
          distance:
            route.distance,

          duration:
            route.duration,
        });

        const steps =
          route.legs?.flatMap(
            (leg) =>
              leg.steps,
          ) ?? [];

        setNavigationSteps(
          steps,
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "Route loading failed:",
          error,
        );

        setRouteSummary(
          undefined,
        );

        setNavigationSteps(
          [],
        );
      }
    }

    void loadRoute();

    return () => {
      cancelled = true;
    };
  }, [
    gpsPos,
    stops,
    isPlanning,
  ]);

  return {
    mapCenter,
    mapMarkers,
    mapRoutes,
    navigationSteps,
    routeSummary,
  };
}

