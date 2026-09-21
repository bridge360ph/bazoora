"use client";

import {
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  CornerUpLeft,
  CornerUpRight,
  Layers,
  LocateFixed,
  MapPin,
  Navigation,
  RotateCw,
} from "lucide-react";

import "mapbox-gl/dist/mapbox-gl.css";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import Map, {
  Layer,
  Marker,
  Popup,
  Source,
  type MapRef,
} from "react-map-gl/mapbox";

import {
  calculateRoute,
  type RouteStep,
} from "@/lib/routing";

import { env } from "@/lib/env";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function ManeuverIcon({
  type,
  modifier,
}: {
  type?: string;
  modifier?: string;
}) {
  const maneuverType =
    type?.toLowerCase() ?? "";
  const maneuverModifier =
    modifier?.toLowerCase() ?? "";

  if (maneuverType === "arrive") {
    return (
      <MapPin className="h-5 w-5 text-emerald-400" />
    );
  }

  switch (maneuverModifier) {
    case "right":
    case "sharp right":
      return (
        <CornerUpRight className="h-5 w-5 text-white" />
      );

    case "left":
    case "sharp left":
      return (
        <CornerUpLeft className="h-5 w-5 text-white" />
      );

    case "slight right":
      return (
        <ArrowUpRight className="h-5 w-5 text-white" />
      );

    case "slight left":
      return (
        <ArrowUpLeft className="h-5 w-5 text-white" />
      );

    case "uturn":
      return (
        <RotateCw className="h-5 w-5 text-white" />
      );

    default:
      return (
        <ArrowUp className="h-5 w-5 text-white" />
      );
  }
}

function formatDistance(
  meters: number,
) {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(
    meters / 1000
  ).toFixed(1)} km`;
}

function formatDuration(
  seconds: number,
) {
  const minutes = Math.ceil(
    seconds / 60,
  );

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(
    minutes / 60,
  );

  const remaining =
    minutes % 60;

  return `${hours}h ${remaining}m`;
}

function formatEta(
  seconds: number,
) {
  return new Date(
    Date.now() + seconds * 1000,
  ).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* -------------------------------------------------------------------------- */
/* Marker icons                                                               */
/* -------------------------------------------------------------------------- */

function TruckIcon({
  pulse,
  heading = 0,
}: {
  pulse?: boolean;
  heading?: number;
}) {
  return (
    <div className="relative h-9 w-9">
      {pulse && (
        <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/30" />
      )}

      <div
        className="absolute inset-0.5 flex items-center justify-center rounded-full bg-blue-600 shadow-[0_2px_8px_rgba(37,99,235,0.5)] transition-transform duration-300"
        style={{
          transform: `rotate(${heading}deg)`,
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5 1.5 1.5 1.5-1.5 1.5-1.5 1.5z" />
        </svg>
      </div>
    </div>
  );
}

function EcoIcon({
  pulse,
}: {
  pulse?: boolean;
}) {
  return (
    <div className="relative h-9 w-9">
      {pulse && (
        <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/30" />
      )}

      <div className="absolute inset-0.5 flex items-center justify-center rounded-full bg-emerald-500 shadow-[0_2px_8px_rgba(16,185,129,0.5)]">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17 8C8 10 5.9 16.17 3.82 21L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-11 8.5V12h-1v-1.5C9 5 15 2 17 2V8z" />
        </svg>
      </div>
    </div>
  );
}

function HomeIcon() {
  return (
    <div className="relative h-8 w-8">
      <div className="absolute inset-0.5 flex items-center justify-center rounded-full bg-orange-500 shadow-[0_2px_8px_rgba(249,115,22,0.5)]">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      </div>
    </div>
  );
}

function DoneIcon() {
  return (
    <div className="relative h-8 w-8">
      <div className="absolute inset-0.5 flex items-center justify-center rounded-full bg-gray-500 shadow-[0_2px_8px_rgba(107,114,128,0.4)]">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      </div>
    </div>
  );
}

function PendingIcon() {
  return (
    <div className="relative h-8 w-8">
      <div className="absolute inset-0 animate-ping rounded-full bg-orange-500/30" />

      <div className="absolute inset-0.5 flex items-center justify-center rounded-full bg-orange-500 shadow-[0_2px_8px_rgba(249,115,22,0.5)]">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
      </div>
    </div>
  );
}

function StopIcon({
  number,
  pulse,
}: {
  number: number;
  pulse?: boolean;
}) {
  return (
    <div className="relative flex h-8 w-8 items-center justify-center">
      {pulse && (
        <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/30" />
      )}

      <div className="absolute inset-0.5 flex items-center justify-center rounded-full border-2 border-white bg-[#1a3a2a] font-mono text-[11px] font-black text-white shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
        {number}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type RouteColor =
  | "blue"
  | "green"
  | "orange"
  | "gray";

export interface MapMarker {
  id?: string;
  position: [number, number];
  label?: string;
  icon?:
    | "truck"
    | "eco"
    | "home"
    | "done"
    | "pending"
    | "stop";
  stopNumber?: number;
  pulse?: boolean;
  heading?: number;
  popupContent?: ReactNode;
}

export interface MapRoute {
  path?: [number, number][];
  waypoints?: [number, number][];
  color: RouteColor;
  label?: string;
  eta?: string;
}

export interface SmartMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  routes?: MapRoute[];
  className?: string;
  start3D?: boolean;
  onMapClick?: (
    pos: [number, number],
  ) => void;
  isCollecting?: boolean;
  navigationSteps?: RouteStep[];
  routeSummary?: {
    distance: number;
    duration: number;
  };
  onMarkComplete?: () => void;
  onReportIssue?: () => void;
}

const ROUTE_COLORS: Record<
  RouteColor,
  string
> = {
  blue: "#2563eb",
  green: "#10b981",
  orange: "#f97316",
  gray: "#9ca3af",
};

/* -------------------------------------------------------------------------- */
/* Route rendering                                                            */
/* -------------------------------------------------------------------------- */

function MapboxLine({
  path,
  color,
  id,
}: {
  path: [number, number][];
  color: RouteColor;
  id: string;
}) {
  const geojson = {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: path.map(
        ([lat, lng]) => [lng, lat],
      ),
    },
  };

  return (
    <Source
      id={id}
      type="geojson"
      data={geojson}
    >
      <Layer
        id={`${id}-line`}
        type="line"
        paint={{
          "line-color":
            ROUTE_COLORS[color],
          "line-width": 5,
          "line-opacity": 0.8,
        }}
      />
    </Source>
  );
}

function distanceMeters(
  lng1: number,
  lat1: number,
  lng2: number,
  lat2: number,
) {
  const radius = 6_371_000;

  const dLat =
    ((lat2 - lat1) *
      Math.PI) /
    180;

  const dLng =
    ((lng2 - lng1) *
      Math.PI) /
    180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(
      (lat1 * Math.PI) / 180,
    ) *
      Math.cos(
        (lat2 * Math.PI) / 180,
      ) *
      Math.sin(dLng / 2) ** 2;

  return (
    radius *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a),
    )
  );
}

function DirectionsRoute({
  waypoints,
  color,
  id,
}: {
  waypoints: [number, number][];
  color: RouteColor;
  id: string;
}) {
  const [path, setPath] =
    useState<
      [number, number][]
    >([]);

  const previousWaypoints =
    useRef<
      [number, number][]
    >([]);

  const waypointsKey =
    JSON.stringify(
      waypoints,
    );

  useEffect(() => {
    const parsed =
      JSON.parse(
        waypointsKey,
      ) as [number, number][];

    if (parsed.length < 2) {
      return;
    }

    const previous =
      previousWaypoints.current;

    if (
      previous.length ===
        parsed.length &&
      path.length > 0
    ) {
      const sameStops =
        parsed
          .slice(1)
          .every(
            (point, index) =>
              point[0] ===
                previous[
                  index + 1
                ]?.[0] &&
              point[1] ===
                previous[
                  index + 1
                ]?.[1],
          );

      if (sameStops) {
        const current =
          parsed[0];

        const old =
          previous[0];

        if (current && old) {
          const distance =
            distanceMeters(
              current[0],
              current[1],
              old[0],
              old[1],
            );

          if (distance < 25) {
            return;
          }
        }
      }
    }

    previousWaypoints.current =
      parsed;

    calculateRoute(parsed, {
      profile: "driving",
    })
      .then((route) => {
        const coordinates =
          route.geometry.coordinates.map(
            ([lng, lat]) =>
              [lat, lng] as [
                number,
                number,
              ],
          );

        setPath(
          coordinates,
        );
      })
      .catch(() => {
        setPath(
          parsed.map(
            ([lng, lat]) =>
              [lat, lng] as [
                number,
                number,
              ],
          ),
        );
      });
  }, [
    waypointsKey,
    color,
    path.length,
  ]);

  if (path.length === 0) {
    return null;
  }

  return (
    <MapboxLine
      id={id}
      path={path}
      color={color}
    />
  );
}

function getBounds(
  coords: [number, number][],
) {
  if (coords.length === 0) {
    return null;
  }

  const first =
    coords[0];

  if (!first) {
    return null;
  }

  let minLng = first[1];
  let maxLng = first[1];
  let minLat = first[0];
  let maxLat = first[0];

  for (const [lat, lng] of coords) {
    minLng = Math.min(
      minLng,
      lng,
    );

    maxLng = Math.max(
      maxLng,
      lng,
    );

    minLat = Math.min(
      minLat,
      lat,
    );

    maxLat = Math.max(
      maxLat,
      lat,
    );
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ] as [
    [number, number],
    [number, number],
  ];
}

/* -------------------------------------------------------------------------- */
/* SmartMap                                                                  */
/* -------------------------------------------------------------------------- */

export default function SmartMap({
  center = [0, 0],
  zoom = 15,
  markers = [],
  routes = [],
  className = "h-full w-full",
  start3D = false,
  onMapClick,
  isCollecting = false,
  navigationSteps = [],
  routeSummary,
  onMarkComplete,
  onReportIssue,
}: SmartMapProps) {
  const [is3D, setIs3D] =
    useState(start3D);

  const [
    etaExpanded,
    setEtaExpanded,
  ] = useState(false);

  const [
    activePopupId,
    setActivePopupId,
  ] = useState<
    string | null
  >(null);

  const mapRef =
    useRef<MapRef>(null);

  const fittedRef =
    useRef(false);

  const previousCoords =
    useRef<
      [number, number] | null
    >(null);

  const centerOnTruck =
    () => {
      const truck =
        markers.find(
          (marker) =>
            marker.id ===
            "truck-main",
        );

      if (!truck) {
        return;
      }

      mapRef.current?.flyTo({
        center: [
          truck.position[1],
          truck.position[0],
        ],
        zoom: 17,
        duration: 800,
      });
    };

  useEffect(() => {
    if (
      !mapRef.current ||
      !isCollecting
    ) {
      return;
    }

    const truck =
      markers.find(
        (marker) =>
          marker.id ===
          "truck-main",
      );

    if (!truck) {
      return;
    }

    mapRef.current.flyTo({
      center: [
        truck.position[1],
        truck.position[0],
      ],
      zoom: 16,
      duration: 800,
    });
  }, [
    markers,
    isCollecting,
  ]);

  useEffect(() => {
    if (!isCollecting) {
      fittedRef.current =
        false;
      return;
    }

    if (fittedRef.current) {
      return;
    }

    const map =
      mapRef.current?.getMap();

    const route =
      routes[0];

    if (!map || !route) {
      return;
    }

    let coords: [
      number,
      number,
    ][] = [];

    if (
      route.path &&
      route.path.length >= 2
    ) {
      coords = route.path;
    } else if (
      route.waypoints &&
      route.waypoints.length >= 2
    ) {
      coords =
        route.waypoints.map(
          ([lng, lat]) =>
            [lat, lng],
        );
    }

    if (coords.length < 2) {
      return;
    }

    const bounds =
      getBounds(coords);

    if (!bounds) {
      return;
    }

    fittedRef.current =
      true;

    map.fitBounds(bounds, {
      padding: 80,
      duration: 1500,
    });
  }, [
    isCollecting,
    routes,
  ]);

  const [
    centerLat,
    centerLng,
  ] = center;

  useEffect(() => {
    if (isCollecting) {
      return;
    }

    const map =
      mapRef.current?.getMap();

    if (!map) {
      return;
    }

    map.flyTo({
      center: [
        centerLng,
        centerLat,
      ],
      zoom,
      duration: 1200,
    });
  }, [
    centerLat,
    centerLng,
    zoom,
    isCollecting,
  ]);

  useEffect(() => {
    if (!isCollecting) {
      previousCoords.current =
        null;
      return;
    }

    const map =
      mapRef.current?.getMap();

    if (!map) {
      return;
    }

    const truck =
      markers.find(
        (marker) =>
          marker.id ===
          "truck-main",
      );

    if (!truck) {
      return;
    }

    const [lat, lng] =
      truck.position;

    const previous =
      previousCoords.current;

    let bearing = 0;

    if (
      previous &&
      (previous[0] !== lat ||
        previous[1] !== lng)
    ) {
      const dLon =
        ((lng -
          previous[1]) *
          Math.PI) /
        180;

      const lat1 =
        (previous[0] *
          Math.PI) /
        180;

      const lat2 =
        (lat * Math.PI) /
        180;

      const y =
        Math.sin(dLon) *
        Math.cos(lat2);

      const x =
        Math.cos(lat1) *
          Math.sin(lat2) -
        Math.sin(lat1) *
          Math.cos(lat2) *
          Math.cos(dLon);

      bearing =
        ((Math.atan2(y, x) *
          180) /
          Math.PI +
          360) %
        360;
    }

    previousCoords.current =
      [lat, lng];

    map.easeTo({
      center: [
        lng,
        lat,
      ],
      zoom: 16.8,
      pitch: 60,
      bearing,
      duration: 1000,
    });
  }, [
    isCollecting,
    markers,
  ]);

  useEffect(() => {
    const map =
      mapRef.current?.getMap();

    if (!map) {
      return;
    }

    map.easeTo({
      pitch:
        is3D ? 45 : 0,
      bearing:
        is3D ? -10 : 0,
      duration: 1000,
    });
  }, [is3D]);

  const renderMarkerIcon =
    useCallback(
      (marker: MapMarker) => {
        switch (
          marker.icon
        ) {
          case "truck":
            return (
              <TruckIcon
                pulse={
                  marker.pulse
                }
                heading={
                  marker.heading
                }
              />
            );

          case "eco":
            return (
              <EcoIcon
                pulse={
                  marker.pulse
                }
              />
            );

          case "home":
            return (
              <HomeIcon />
            );

          case "done":
            return (
              <DoneIcon />
            );

          case "pending":
            return (
              <PendingIcon />
            );

          case "stop":
            return (
              <StopIcon
                number={
                  marker.stopNumber ??
                  1
                }
                pulse={
                  marker.pulse
                }
              />
            );

          default:
            return null;
        }
      },
      [],
    );

  const getProgressPercentage =
    () => {
      const total =
        markers.filter(
          (marker) =>
            marker.id?.startsWith(
              "stop-",
            ),
        ).length;

      if (total === 0) {
        return 0;
      }

      const completed =
        markers.filter(
          (marker) =>
            marker.id?.startsWith(
              "stop-",
            ) &&
            marker.icon ===
              "done",
        ).length;

      return Math.round(
        (completed / total) *
          100,
      );
    };

  return (
    <div
      className={`relative ${className} overflow-hidden`}
    >
      <Map
        ref={mapRef}
        initialViewState={{
          latitude:
            center[0],
          longitude:
            center[1],
          zoom,
          pitch:
            start3D
              ? 45
              : 0,
          bearing:
            start3D
              ? -10
              : 0,
        }}
        onClick={(event) => {
          onMapClick?.([
            event.lngLat.lat,
            event.lngLat.lng,
          ]);
        }}
        onLoad={(event) => {
          const map =
            event.target;

          const layers =
            map.getStyle()
              .layers;

          const labelLayer =
            layers?.find(
              (layer) =>
                layer.type ===
                "symbol",
            );

          if (
            !map.getLayer(
              "3d-buildings",
            )
          ) {
            map.addLayer(
              {
                id: "3d-buildings",
                source:
                  "composite",
                "source-layer":
                  "building",
                filter: [
                  "==",
                  "extrude",
                  "true",
                ],
                type: "fill-extrusion",
                minzoom: 15,
                paint: {
                  "fill-extrusion-color":
                    "#cbd5e1",
                  "fill-extrusion-height":
                    [
                      "interpolate",
                      ["linear"],
                      ["zoom"],
                      15,
                      0,
                      15.05,
                      [
                        "get",
                        "height",
                      ],
                    ],
                  "fill-extrusion-base":
                    [
                      "interpolate",
                      ["linear"],
                      ["zoom"],
                      15,
                      0,
                      15.05,
                      [
                        "get",
                        "min_height",
                      ],
                    ],
                  "fill-extrusion-opacity":
                    0.6,
                },
              },
              labelLayer?.id,
            );
          }
        }}
        mapStyle={
          isCollecting
            ? "mapbox://styles/mapbox/streets-v12"
            : "mapbox://styles/mapbox/light-v11"
        }
        mapboxAccessToken={
          env.VITE_MAPBOX_ACCESS_TOKEN ??
          ""
        }
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        {routes.map(
          (route, index) => {
            const routeId =
              `route-${index}`;

            if (
              route.path &&
              route.path.length > 1
            ) {
              return (
                <MapboxLine
                  key={routeId}
                  id={routeId}
                  path={route.path}
                  color={
                    route.color
                  }
                />
              );
            }

            if (
              route.waypoints &&
              route.waypoints
                .length >= 2
            ) {
              return (
                <DirectionsRoute
                  key={routeId}
                  id={routeId}
                  waypoints={
                    route.waypoints
                  }
                  color={
                    route.color
                  }
                />
              );
            }

            return null;
          },
        )}

        {markers.map(
          (marker, index) => {
            const markerId =
              marker.id ??
              `marker-${index}`;

            return (
              <div
                key={markerId}
              >
                <Marker
                  longitude={
                    marker
                      .position[1]
                  }
                  latitude={
                    marker
                      .position[0]
                  }
                  anchor="bottom"
                  onClick={(event) => {
                    event.originalEvent.stopPropagation();

                    setActivePopupId(
                      markerId,
                    );
                  }}
                >
                  <div className="cursor-pointer">
                    {renderMarkerIcon(
                      marker,
                    )}
                  </div>
                </Marker>

                {activePopupId ===
                  markerId && (
                  <Popup
                    longitude={
                      marker
                        .position[1]
                    }
                    latitude={
                      marker
                        .position[0]
                    }
                    anchor="bottom"
                    closeOnClick={false}
                    offset={18}
                    onClose={() =>
                      setActivePopupId(
                        null,
                      )
                    }
                  >
                    {marker.popupContent ? (
                      <div className="font-sans text-xs text-gray-900">
                        {
                          marker.popupContent
                        }
                      </div>
                    ) : marker.label ? (
                      <div className="font-sans text-xs font-bold text-gray-900">
                        {marker.label}
                      </div>
                    ) : null}
                  </Popup>
                )}
              </div>
            );
          },
        )}
      </Map>

      {/* Map controls */}
      <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">
        <button
          type="button"
          onClick={
            centerOnTruck
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-md hover:bg-slate-50 active:scale-95"
          title="Center location"
        >
          <LocateFixed className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() =>
            setIs3D(
              (value) =>
                !value,
            )
          }
          title={
            is3D
              ? "Switch to 2D"
              : "Switch to 3D"
          }
          className={`flex h-10 w-10 items-center justify-center rounded-xl border shadow-md transition-all active:scale-90 ${
            is3D
              ? "border-blue-200 bg-blue-600 text-white"
              : "border-gray-100 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Layers className="h-4 w-4" />
        </button>
      </div>

      {/* Collapsible ETA card */}
      {(() => {
        const activeStep =
          navigationSteps[0];

        if (
          !isCollecting ||
          !activeStep
        ) {
          return null;
        }

        return (
          <div className="absolute bottom-5 left-1/2 z-[1000] w-[340px] -translate-x-1/2">
            <div className="overflow-hidden rounded-2xl border border-emerald-700 bg-emerald-600/95 text-white shadow-2xl backdrop-blur-md">
              {/* Drag / toggle handle */}
              <button
                type="button"
                onClick={() =>
                  setEtaExpanded(
                    (value) =>
                      !value,
                  )
                }
                className="relative flex w-full items-center justify-center py-1.5"
                aria-label={
                  etaExpanded
                    ? "Collapse route details"
                    : "Expand route details"
                }
              >
                <div className="h-1.5 w-12 rounded-full bg-white/40" />

                <span className="absolute right-3">
                  {etaExpanded ? (
                    <ChevronDown className="h-4 w-4 text-white/80" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-white/80" />
                  )}
                </span>
              </button>

              {/* Always visible */}
              <div className="px-3 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                    <ManeuverIcon
                      type={
                        activeStep
                          .maneuver
                          ?.type
                      }
                      modifier={
                        activeStep
                          .maneuver
                          ?.modifier
                      }
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-lg font-black">
                      {formatDistance(
                        activeStep.distance,
                      )}
                    </div>

                    <p className="truncate text-[11px] font-semibold text-emerald-100">
                      {activeStep
                        .maneuver
                        ?.instruction ??
                        "Continue driving"}
                    </p>
                  </div>
                </div>

                {/* Complete button remains visible when collapsed */}
                {!etaExpanded && (
                  <button
                    type="button"
                    onClick={
                      onMarkComplete
                    }
                    className="mt-3 w-full rounded-xl bg-white px-3 py-2.5 text-xs font-extrabold text-emerald-700 shadow-sm transition hover:bg-emerald-50 active:scale-[0.98]"
                  >
                    Mark as Complete
                  </button>
                )}
              </div>

              {/* Expandable details */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  etaExpanded
                    ? "max-h-[320px] opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="border-t border-white/20 px-3 pb-3 pt-3">
                  {routeSummary && (
                    <>
                      {/* ETA + remaining */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold tracking-widest text-emerald-100">
                            ARRIVAL
                          </span>

                          <p className="text-lg font-black text-white">
                            {formatEta(
                              routeSummary.duration,
                            )}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold tracking-widest text-emerald-100">
                            REMAINING
                          </span>

                          <p className="text-sm font-bold text-white">
                            {formatDuration(
                              routeSummary.duration,
                            )}
                            {" · "}
                            {formatDistance(
                              routeSummary.distance,
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="mt-3">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                          <div
                            className="h-full rounded-full bg-white transition-all duration-300"
                            style={{
                              width: `${getProgressPercentage()}%`,
                            }}
                          />
                        </div>

                        <div className="mt-1 flex justify-between text-[8px] font-extrabold tracking-widest text-emerald-100">
                          <span>
                            START
                          </span>

                          <span>
                            PROGRESS
                          </span>

                          <span>
                            END
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Expanded actions */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={
                        onMarkComplete
                      }
                      className="rounded-xl bg-white px-3 py-2.5 text-xs font-extrabold text-emerald-700 shadow-sm transition hover:bg-emerald-50 active:scale-[0.98]"
                    >
                      Mark as Complete
                    </button>

                    <button
                      type="button"
                      onClick={
                        onReportIssue
                      }
                      className="rounded-xl bg-red-600 px-3 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98]"
                    >
                      Report Issue
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Non-navigation ETA */}
      {!isCollecting &&
        routes.map(
          (route, index) =>
            route.eta && (
              <div
                key={`eta-${index}`}
                className="absolute bottom-4 left-4 z-[1000] flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md"
                style={{
                  background: `${ROUTE_COLORS[route.color]}cc`,
                }}
              >
                <Navigation className="h-3.5 w-3.5" />

                {route.label && (
                  <span>
                    {route.label} ·
                  </span>
                )}

                <span>
                  ETA {route.eta}
                </span>
              </div>
            ),
        )}
    </div>
  );
}

