"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import Map, { Marker, Popup, Source, Layer, type MapRef } from "react-map-gl/mapbox";
import { useEffect, useRef, useState, useCallback } from "react";
import { calculateRoute, type RouteStep } from "@/lib/routing";
import {
  Layers,
  Navigation,
  MapPin,
  ArrowUp,
  ArrowUpRight,
  ArrowUpLeft,
  CornerUpRight,
  CornerUpLeft,
  RotateCw,
} from "lucide-react";
import { env } from "@/lib/env";

/* ─── Maneuver Icon HUD Helper ──────────────────────────────────────── */
function ManeuverIcon({ type, modifier }: { type?: string; modifier?: string }) {
  const m = modifier?.toLowerCase() ?? "";
  const t = type?.toLowerCase() ?? "";

  if (t === "arrive") {
    return <MapPin className="h-5 w-5 text-emerald-400" />;
  }

  switch (m) {
    case "right":
    case "sharp right": {
      return <CornerUpRight className="h-5 w-5 text-white" />;
    }
    case "left":
    case "sharp left": {
      return <CornerUpLeft className="h-5 w-5 text-white" />;
    }
    case "slight right": {
      return <ArrowUpRight className="h-5 w-5 text-white" />;
    }
    case "slight left": {
      return <ArrowUpLeft className="h-5 w-5 text-white" />;
    }
    case "uturn": {
      return <RotateCw className="h-5 w-5 text-white" />;
    }
    default: {
      return <ArrowUp className="h-5 w-5 text-white" />;
    }
  }
}

/* ─── Metric Formatting Helpers ───────────────────────────────────────── */
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}m`;
}

function formatEta(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ─── Custom SVG marker components ─────────────────────────────────── */
function TruckIcon({ pulse }: { pulse?: boolean | undefined }) {
  return (
    <div className="relative h-9 w-9">
      {pulse && <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/30" />}
      <div className="absolute inset-0.5 flex items-center justify-center rounded-full bg-blue-600 shadow-[0_2px_8px_rgba(37,99,235,0.5)]">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
        </svg>
      </div>
    </div>
  );
}

function EcoIcon({ pulse }: { pulse?: boolean | undefined }) {
  return (
    <div className="relative h-9 w-9">
      {pulse && <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/30" />}
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
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 2.5 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
      </div>
    </div>
  );
}

function StopIcon({ number, pulse }: { number: number; pulse?: boolean | undefined }) {
  return (
    <div className="relative flex h-8 w-8 items-center justify-center">
      {pulse && <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/30" />}
      <div className="absolute inset-0.5 flex items-center justify-center rounded-full border-2 border-white bg-[#1a3a2a] font-mono text-[11px] font-black text-white shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition-all hover:bg-[#2d6a4f]">
        {number}
      </div>
    </div>
  );
}

/* ─── Types ──────────────────────────────────────────────────────────── */
export type RouteColor = "blue" | "green" | "orange" | "gray";

export interface MapMarker {
  id?: string;
  position: [number, number]; // [lat, lng]
  label?: string;
  icon?: "truck" | "eco" | "home" | "done" | "pending" | "stop";
  stopNumber?: number;
  pulse?: boolean;
  popupContent?: React.ReactNode;
}

export interface MapRoute {
  path?: [number, number][] | undefined; // [lat, lng] pairs
  waypoints?: [number, number][] | undefined; // [lng, lat] pairs
  color: RouteColor;
  label?: string | undefined;
  eta?: string | undefined;
}

export interface SmartMapProps {
  center?: [number, number] | undefined;
  zoom?: number | undefined;
  markers?: MapMarker[] | undefined;
  routes?: MapRoute[] | undefined;
  className?: string | undefined;
  start3D?: boolean | undefined;
  onMapClick?: ((pos: [number, number]) => void) | undefined;
  isCollecting?: boolean | undefined;
  navigationSteps?: RouteStep[] | undefined;
  routeSummary?:
    | {
        distance: number;
        duration: number;
      }
    | undefined;
}

/* ─── Route color map ───────────────────────────────────────────────── */
const ROUTE_COLORS: Record<RouteColor, string> = {
  blue: "#2563eb",
  green: "#10b981",
  orange: "#f97316",
  gray: "#9ca3af",
};

/* ─── Mapbox Line Component ─────────────────────────────────────────── */
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
      coordinates: path.map(([lat, lng]) => [lng, lat]),
    },
  };

  return (
    <Source id={id} type="geojson" data={geojson}>
      <Layer
        id={`${id}-line`}
        type="line"
        paint={{
          "line-color": ROUTE_COLORS[color],
          "line-width": 5,
          "line-opacity": 0.8,
        }}
      />
    </Source>
  );
}

/* ─── Helper for distance calculation ───────────────────────────────── */
function distanceMeters(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ─── Mapbox Route Resolver ─────────────────────────────────────────── */
function DirectionsRoute({
  waypoints,
  color,
  id,
}: {
  waypoints: [number, number][];
  color: RouteColor;
  id: string;
}) {
  const [path, setPath] = useState<[number, number][]>([]);
  const prevWaypointsRef = useRef<[number, number][]>([]);
  const waypointsStr = JSON.stringify(waypoints);

  useEffect(() => {
    const parsedWaypoints = JSON.parse(waypointsStr) as [number, number][];
    if (parsedWaypoints.length < 2) return;

    const prev = prevWaypointsRef.current;
    if (prev.length === parsedWaypoints.length && path.length > 0) {
      const stopsIdentical = parsedWaypoints
        .slice(1)
        .every((wp, i) => wp[0] === prev[i + 1]?.[0] && wp[1] === prev[i + 1]?.[1]);
      if (stopsIdentical) {
        const wp0 = parsedWaypoints[0];
        const pr0 = prev[0];
        if (wp0 && pr0) {
          const d = distanceMeters(wp0[0], wp0[1], pr0[0], pr0[1]);
          if (d < 25) {
            return;
          }
        }
      }
    }

    prevWaypointsRef.current = parsedWaypoints;

    calculateRoute(parsedWaypoints, { profile: "driving" })
      .then((route) => {
        const coords = route.geometry.coordinates.map(
          ([lng, lat]) => [lat, lng] as [number, number],
        );
        setPath(coords);
      })
      .catch(() => {
        const fallback = parsedWaypoints.map(([lng, lat]) => [lat, lng] as [number, number]);
        setPath(fallback);
      });
  }, [waypointsStr, color, path.length]);

  if (path.length === 0) return null;
  return <MapboxLine path={path} color={color} id={id} />;
}

/* ─── Bounding box helper for fitBounds ─────────────────────────────── */
function getBounds(coords: [number, number][]): [[number, number], [number, number]] | null {
  if (coords.length === 0) return null;
  const first = coords[0];
  if (!first) return null;
  let minLng = first[1];
  let maxLng = first[1];
  let minLat = first[0];
  let maxLat = first[0];
  for (const [lat, lng] of coords) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

/* ─── Main SmartMap component ────────────────────────────────────────── */
export default function SmartMap({
  center = [14.3833, 120.8833],
  zoom = 15,
  markers = [],
  routes = [],
  className = "h-full w-full",
  start3D = false,
  onMapClick,
  isCollecting = false,
  navigationSteps = [],
  routeSummary,
}: SmartMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [is3D, setIs3D] = useState(start3D);
  const [activePopupId, setActivePopupId] = useState<string | null>(null);
  const mapRef = useRef<MapRef>(null);

  const hasFittedRef = useRef(false);
  const prevCoordsRef = useRef<[number, number] | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Track isCollecting transition to true to trigger fitBounds
  useEffect(() => {
    if (!isCollecting) {
      hasFittedRef.current = false;
    } else if (!hasFittedRef.current) {
      const map = mapRef.current?.getMap();
      const route = routes?.[0];
      if (map && route) {
        let coords: [number, number][] = [];
        if (route.path && route.path.length >= 2) {
          coords = route.path;
        } else if (route.waypoints && route.waypoints.length >= 2) {
          coords = route.waypoints.map(([lng, lat]) => [lat, lng]);
        }

        if (coords.length >= 2) {
          const bounds = getBounds(coords);
          if (bounds) {
            hasFittedRef.current = true;
            map.fitBounds(bounds, {
              padding: { top: 80, bottom: 80, left: 80, right: 80 },
              duration: 1500,
            });
          }
        }
      }
    }
  }, [isCollecting, routes]);

  // Update camera focus when center or zoom changes, unless we are collecting
  useEffect(() => {
    if (isCollecting) return; // Do not use flyTo during navigation tracking
    const map = mapRef.current?.getMap();
    if (map) {
      map.flyTo({
        center: [center[1], center[0]],
        zoom,
        duration: 1200,
      });
    }
  }, [center[0], center[1], zoom, isCollecting]);

  // Dynamic Camera Following during active navigation
  useEffect(() => {
    if (!isCollecting) {
      prevCoordsRef.current = null;
      return;
    }
    const map = mapRef.current?.getMap();
    if (!map) return;

    const [lat, lng] = center;
    const prev = prevCoordsRef.current;
    let bearing = 0;

    if (prev && (prev[0] !== lat || prev[1] !== lng)) {
      // Calculate bearing direction
      const dLon = ((lng - prev[1]) * Math.PI) / 180;
      const lat1Rad = (prev[0] * Math.PI) / 180;
      const lat2Rad = (lat * Math.PI) / 180;
      const y = Math.sin(dLon) * Math.cos(lat2Rad);
      const x =
        Math.cos(lat1Rad) * Math.sin(lat2Rad) -
        Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
      const brng = (Math.atan2(y, x) * 180) / Math.PI;
      bearing = (brng + 360) % 360;
    }

    prevCoordsRef.current = center;

    map.easeTo({
      center: [lng, lat],
      zoom: 16.8,
      pitch: 60,
      bearing: prev ? bearing : 0,
      duration: 1000,
    });
  }, [center, isCollecting]);

  // Handle 3D ease toggle natively
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (map) {
      map.easeTo({
        pitch: is3D ? 45 : 0,
        bearing: is3D ? -10 : 0,
        duration: 1000,
      });
    }
  }, [is3D]);

  const renderMarkerIcon = useCallback((m: MapMarker) => {
    switch (m.icon) {
      case "truck": {
        return <TruckIcon pulse={m.pulse} />;
      }
      case "eco": {
        return <EcoIcon pulse={m.pulse} />;
      }
      case "home": {
        return <HomeIcon />;
      }
      case "done": {
        return <DoneIcon />;
      }
      case "pending": {
        return <PendingIcon />;
      }
      case "stop": {
        return <StopIcon number={m.stopNumber ?? 1} pulse={m.pulse} />;
      }
      default: {
        return null;
      }
    }
  }, []);

  const getProgressPercentage = () => {
    const totalStops = markers.filter((m) => m.id?.startsWith("stop-")).length;
    if (totalStops === 0) return 0;
    const completedStops = markers.filter(
      (m) => m.id?.startsWith("stop-") && m.icon === "done",
    ).length;
    return Math.round((completedStops / totalStops) * 100);
  };

  if (!isMounted) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-emerald-500" />
          <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">Loading Map</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className} overflow-hidden`}>
      <Map
        ref={mapRef}
        initialViewState={{
          latitude: center[0],
          longitude: center[1],
          zoom,
          pitch: start3D ? 45 : 0,
          bearing: start3D ? -10 : 0,
        }}
        onClick={(e: any) => {
          if (onMapClick) {
            onMapClick([e.lngLat.lat, e.lngLat.lng]);
          }
        }}
        onLoad={(e: any) => {
          const map = e.target;
          const layers = map.getStyle().layers;
          const labelLayer = layers?.find(
            (layer: any) => layer.type === "symbol" && layer.layout?.["text-field"],
          );
          const labelLayerId = labelLayer ? labelLayer.id : undefined;

          if (!map.getLayer("3d-buildings")) {
            map.addLayer(
              {
                id: "3d-buildings",
                source: "composite",
                "source-layer": "building",
                filter: ["==", "extrude", "true"],
                type: "fill-extrusion",
                minzoom: 15,
                paint: {
                  "fill-extrusion-color": "#cbd5e1",
                  "fill-extrusion-height": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    15,
                    0,
                    15.05,
                    ["get", "height"],
                  ],
                  "fill-extrusion-base": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    15,
                    0,
                    15.05,
                    ["get", "min_height"],
                  ],
                  "fill-extrusion-opacity": 0.6,
                },
              },
              labelLayerId,
            );
          }
        }}
        mapStyle={
          isCollecting
            ? "mapbox://styles/mapbox/navigation-night-v1"
            : "mapbox://styles/mapbox/light-v11"
        }
        mapboxAccessToken={env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Routes */}
        {routes.map((route, i) => {
          const routeId = `route-${i}`;
          if (route.path && route.path.length > 1) {
            return <MapboxLine key={routeId} id={routeId} path={route.path} color={route.color} />;
          }
          if (route.waypoints && route.waypoints.length >= 2) {
            return (
              <DirectionsRoute
                key={routeId}
                id={routeId}
                waypoints={route.waypoints}
                color={route.color}
              />
            );
          }
          return null;
        })}

        {/* Markers */}
        {markers.map((marker, i) => {
          const mId = marker.id ?? `marker-${i}`;
          return (
            <div key={mId}>
              <Marker
                longitude={marker.position[1]}
                latitude={marker.position[0]}
                onClick={(e: any) => {
                  e.originalEvent.stopPropagation();
                  setActivePopupId(mId);
                }}
              >
                <div className="cursor-pointer">{renderMarkerIcon(marker)}</div>
              </Marker>

              {activePopupId === mId && (
                <Popup
                  longitude={marker.position[1]}
                  latitude={marker.position[0]}
                  anchor="bottom"
                  onClose={() => {
                    setActivePopupId(null);
                  }}
                  closeOnClick={false}
                  offset={18}
                >
                  {marker.popupContent ? (
                    <div className="font-sans text-xs text-gray-900">{marker.popupContent}</div>
                  ) : marker.label ? (
                    <div className="font-sans text-xs font-bold text-gray-900">{marker.label}</div>
                  ) : null}
                </Popup>
              )}
            </div>
          );
        })}
      </Map>

      {/* Map controls overlay */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            setIs3D((v) => !v);
          }}
          title={is3D ? "Switch to 2D" : "Switch to 3D"}
          className={`flex h-10 w-10 items-center justify-center rounded-xl border shadow-md transition-all active:scale-90 ${
            is3D
              ? "border-blue-200 bg-blue-600 text-white"
              : "border-gray-100 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Layers className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation HUD Overlays */}
      {(() => {
        const activeStep = navigationSteps?.[0];
        if (!isCollecting || !activeStep) return null;

        return (
          <>
            {/* Top Instruction Banner */}
            <div className="animate-in fade-in slide-in-from-top-4 absolute top-4 right-4 left-4 z-[1000] mx-auto max-w-sm duration-300">
              <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/90 p-4 text-white shadow-2xl backdrop-blur-md">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-500/30">
                  <ManeuverIcon
                    type={activeStep.maneuver?.type || ""}
                    modifier={activeStep.maneuver?.modifier || ""}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1">
                    <span className="font-sans text-xl leading-none font-black tracking-tight">
                      {formatDistance(activeStep.distance)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-300">
                    {activeStep.maneuver?.instruction ?? "Drive forward"}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Arrival Stats */}
            {routeSummary && (
              <div className="animate-in fade-in slide-in-from-bottom-4 absolute right-4 bottom-4 left-4 z-[1000] mx-auto max-w-sm duration-300">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                        ARRIVAL TIME
                      </span>
                      <p className="text-xl font-black text-white">
                        {formatEta(routeSummary.duration)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                        REMAINING
                      </span>
                      <p className="text-xs font-bold text-slate-300">
                        {formatDuration(routeSummary.duration)} ·{" "}
                        {formatDistance(routeSummary.distance)}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${getProgressPercentage()}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[8px] font-extrabold tracking-widest text-slate-500 uppercase">
                      <span>START</span>
                      <span>PROGRESS</span>
                      <span>END</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* ETA overlays (Only show if not in navigation mode) */}
      {!isCollecting &&
        routes.map(
          (route, i) =>
            route.eta && (
              <div
                key={`eta-${i.toString()}`}
                className="absolute bottom-4 left-4 z-[1000] flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md"
                style={{ background: `${ROUTE_COLORS[route.color]}cc` }}
              >
                <Navigation className="h-3.5 w-3.5" />
                {route.label && <span>{route.label} ·</span>}
                <span>ETA {route.eta}</span>
              </div>
            ),
        )}
    </div>
  );
}
