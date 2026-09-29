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
  routePath = [],
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
   *
   * Before starting:
   * - Collection points take priority.
   * - Driver GPS is still shown as a marker.
   *
   * After starting:
   * - Driver GPS becomes the map center.
   *
   * If there are no collection points:
   * - Driver GPS is used as the center.
   */
  const mapCenter =
    useMemo<
      [number, number] | undefined
    >(() => {
      const validStops =
        stops.filter(
          (stop) =>
            Number.isFinite(
              stop.lat,
            ) &&
            Number.isFinite(
              stop.lng,
            ),
        );

      /*
       * Before the route starts,
       * center around the assigned
       * collection points.
       */
      if (
        !isCollecting &&
        validStops.length > 0
      ) {
        const totalLat =
          validStops.reduce(
            (sum, stop) =>
              sum + stop.lat,
            0,
          );

        const totalLng =
          validStops.reduce(
            (sum, stop) =>
              sum + stop.lng,
            0,
          );

        return [
          totalLat /
            validStops.length,
          totalLng /
            validStops.length,
        ];
      }

      /*
       * After starting the route,
       * follow the driver's GPS.
       *
       * Also use GPS when there are
       * no assigned collection points.
       */
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

      /*
       * Fallback to the first valid
       * collection point.
       */
      const firstStop =
        validStops[0];

      if (firstStop) {
        return [
          firstStop.lat,
          firstStop.lng,
        ];
      }

      return undefined;
    }, [
      gpsPos,
      stops,
      isCollecting,
    ]);

  /*
   * ---------------- MARKERS
   *
   * The driver's location is visible
   * as soon as location permission is
   * granted.
   *
   * Stop markers remain visible before
   * and after starting the route.
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
            id: `stop-${
              stop.stopNumber ||
              index + 1
            }`,

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
   * ---------------- ROUTE PREVIEW
   *
   * The route is visible BEFORE
   * Start Route is pressed.
   *
   * Preview:
   *
   * Driver GPS
   *     ↓
   * Stop 1
   *     ↓
   * Stop 2
   *     ↓
   * Stop 3
   *
   * routePath uses:
   * [latitude, longitude]
   *
   * SmartMap routes use:
   * [longitude, latitude]
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

      /*
       * Use routePath when available.
       *
       * This allows CurrentRoute to
       * provide:
       *
       * Driver → Stop 1 → Stop 2...
       */
      if (
        routePath.length >= 2
      ) {
        const waypoints =
          routePath
            .filter(
              (point) =>
                Number.isFinite(
                  point[0],
                ) &&
                Number.isFinite(
                  point[1],
                ),
            )
            .map(
              (point) =>
                [
                  point[1],
                  point[0],
                ] as [
                  number,
                  number,
                ],
            );

        if (
          waypoints.length >= 2
        ) {
          return [
            {
              waypoints,
              color: "green",
              label:
                "Driver Route",
            },
          ];
        }
      }

      /*
       * Fallback route construction.
       *
       * GPS is included both before
       * and after starting the route.
       */
      const waypoints: [
        number,
        number,
      ][] = [
        ...(gpsPos
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

        ...activeStops
          .filter(
            (stop) =>
              Number.isFinite(
                stop.lat,
              ) &&
              Number.isFinite(
                stop.lng,
              ),
          )
          .map(
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
      routePath,
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

          ...activeStops
            .filter(
              (stop) =>
                Number.isFinite(
                  stop.lat,
                ) &&
                Number.isFinite(
                  stop.lng,
                ),
            )
            .map(
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

        if (
          points.length < 2
        ) {
          return;
        }

        const coords =
          points
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

