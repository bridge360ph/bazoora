"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import SmartMap from "@/components/map/smart-map";
import {
  MapPin,
  Loader2,
  AlertCircle,
  Navigation,
  Check,
  CornerUpRight,
  Building2,
  Crosshair,
  MessageSquareWarning,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { geocode, reverseGeocode } from "@/lib/geocoding";
import { LocationPermissionModal } from "@/components/ui/location-permission";
import { fetchRoutes } from "@/features/route-management/routeService";
import type { Route } from "@bazoora/shared";
import type { MapMarker, MapRoute } from "@/components/map/smart-map";
import { toast } from "sonner";

interface RouteStop {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: "pending" | "active" | "completed";
  completedAt?: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const LOCAL_CENTER: [number, number] = [14.3833, 120.8833];

// CALCULATE HAVERSINE DISTANCE BETWEEN SEQUENTIAL COORDINATES IN KILOMETERS
function calculateRouteDistance(waypoints: RouteStop[]): string {
  if (waypoints.length < 2) return "0.0";
  let totalKm = 0;
  const R = 6371;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const lat1 = (waypoints[i].lat * Math.PI) / 180;
    const lon1 = (waypoints[i].lng * Math.PI) / 180;
    const lat2 = (waypoints[i + 1].lat * Math.PI) / 180;
    const lon2 = (waypoints[i + 1].lng * Math.PI) / 180;

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalKm += R * c;
  }

  return totalKm.toFixed(1);
}

export default function EcoAideRoute(): React.ReactNode {
  const user = useAuthStore((s) => s.user);

  const [assignedRoute, setAssignedRoute] = useState<Route | null>(null);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(true);
  const [isGeocodingStops, setIsGeocodingStops] = useState<boolean>(false);
  const [routeCompleted, setRouteCompleted] = useState<boolean>(false);

  const [gpsPos, setGpsPos] = useState<[number, number] | null>(null);
  const gpsPosRef = useRef<[number, number] | null>(null);
  const [gpsAddress, setGpsAddress] = useState<string>("Detecting location...");
  const [isCollecting, setIsCollecting] = useState<boolean>(false);

  const hasLoadedRef = useRef<boolean>(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    gpsPosRef.current = gpsPos;
  }, [gpsPos]);

  // GEOLOCATION DETECTION HANDLER
  const detectGps = useCallback((): Promise<[number, number] | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setGpsPos(coords);
          gpsPosRef.current = coords;

          try {
            const res = await reverseGeocode(coords[0], coords[1]);
            setGpsAddress(res.display_name ?? `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`);
          } catch {
            setGpsAddress(`${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`);
          }
          resolve(coords);
        },
        (err) => {
          console.warn("GPS error:", err);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 5000 },
      );
    });
  }, []);

  useEffect(() => {
    void detectGps();
  }, [detectGps]);

  // ROUTE AND WAYPOINT LOADER
  const loadAssignedRoute = useCallback(
    async (force = false) => {
      if (!user?.id) return;
      if (hasLoadedRef.current && !force) return;
      hasLoadedRef.current = true;

      setIsLoadingRoute(true);
      setRouteCompleted(false);

      try {
        let currentPos = gpsPosRef.current;
        if (!currentPos) {
          currentPos = await detectGps();
        }

        const baseAnchor: [number, number] = currentPos ?? LOCAL_CENTER;
        const allRoutes = await fetchRoutes();
        const currentAssigned = allRoutes.find(
          (r) => r.assignedEcoAideId === user.id || r.assignedEcoAide?.id === user.id,
        );

        setAssignedRoute(currentAssigned ?? null);

        if (currentAssigned?.waypoints) {
          setIsGeocodingStops(true);
          const rawStops = currentAssigned.waypoints
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

          const resolvedStops: RouteStop[] = [];

          for (let i = 0; i < rawStops.length; i++) {
            const stopName = rawStops[i];
            let lat = baseAnchor[0] + (i + 1) * 0.0025;
            let lng = baseAnchor[1] + (i + 1) * 0.0025;

            try {
              if (i > 0) {
                await sleep(1100);
              }

              let results = await geocode(`${stopName}, ${currentAssigned.barangay}`, { limit: 1, countryCodes: "ph" });
              let match = results?.[0];

              if (!match) {
                results = await geocode(stopName, { limit: 1, countryCodes: "ph" });
                match = results?.[0];
              }

              if (match && match.lat && match.lon) {
                const parsedLat = Number(match.lat);
                const parsedLng = Number(match.lon);
                if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
                  lat = parsedLat;
                  lng = parsedLng;
                }
              }
            } catch (err) {
              console.warn(`Geocoding failed for ${stopName}:`, err);
            }

            resolvedStops.push({
              id: `stop-${i + 1}`,
              name: stopName,
              address: `${stopName}, ${currentAssigned.barangay}`,
              lat,
              lng,
              status: i === 0 ? "active" : "pending",
            });
          }

          setStops(resolvedStops);
          setIsGeocodingStops(false);
        } else {
          setStops([]);
        }
      } catch (error) {
        console.error("Failed to load assigned route:", error);
        toast.error("Failed to fetch assigned route.");
      } finally {
        setIsLoadingRoute(false);
      }
    },
    [user?.id, detectGps],
  );

  useEffect(() => {
    void loadAssignedRoute();
  }, [loadAssignedRoute]);

  // LIVE GPS TRACKING WATCHER
  useEffect(() => {
    if (!isCollecting) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setGpsPos(coords);
        gpsPosRef.current = coords;
        try {
          const res = await reverseGeocode(coords[0], coords[1]);
          setGpsAddress(res.display_name ?? `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`);
        } catch {
          setGpsAddress(`${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`);
        }
      },
      (err) => console.warn("GPS watch error:", err),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 30000 },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isCollecting]);

  const markStopCompleted = (stopId: string) => {
    if (!isCollecting) {
      toast.info("Please start the collection route first.");
      return;
    }

    const timestamp = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date());

    setStops((prev) => {
      const next = [...prev];
      const idx = next.findIndex((s) => s.id === stopId);
      if (idx !== -1) {
        next[idx] = {
          ...next[idx],
          status: "completed",
          completedAt: timestamp,
        };
        if (idx + 1 < next.length) {
          next[idx + 1] = { ...next[idx + 1], status: "active" };
        }
      }
      return next;
    });
    toast.success("Stop marked as completed.");
  };

  const activeStop = stops.find((s) => s.status === "active");
  const allStopsDone = stops.length > 0 && stops.every((s) => s.status === "completed");

  const totalDistanceKm = useMemo(() => calculateRouteDistance(stops), [stops]);

  const mapCenter: [number, number] =
    gpsPos ?? (stops.length > 0 ? [stops[0].lat, stops[0].lng] : LOCAL_CENTER);

  const mapMarkers: MapMarker[] = [
    ...(gpsPos
      ? [
          {
            id: "eco-aide-self",
            position: gpsPos,
            label: "My Location",
            icon: "eco" as const,
            pulse: isCollecting,
          },
        ]
      : []),
    ...stops.map((stop, idx) => ({
      id: stop.id,
      position: [Number(stop.lat), Number(stop.lng)] as [number, number],
      label: stop.name,
      icon: (stop.status === "completed" ? "done" : "stop") as any,
      stopNumber: idx + 1,
      pulse: stop.status === "active" && isCollecting,
    })),
  ];

  const remainingStops = stops.filter((s) => s.status !== "completed");
  const activeWaypoints = remainingStops.length > 0 ? remainingStops : stops;

  const mapRoutes: MapRoute[] =
    stops.length >= 2
      ? [
          {
            waypoints: [
              ...(gpsPos && isCollecting ? [[gpsPos[1], gpsPos[0]] as [number, number]] : []),
              ...activeWaypoints.map((s) => [Number(s.lng), Number(s.lat)] as [number, number]),
            ],
            color: "green",
            label: assignedRoute?.name ?? "Collection Route",
          },
        ]
      : [];

  return (
    <div className="relative flex w-full flex-col bg-[#eef1f4] p-4 md:p-6 lg:h-full lg:overflow-hidden lg:flex-row lg:gap-6 font-['Inter',sans-serif]">
      <LocationPermissionModal onAllow={detectGps} />

      {/* LEFT COLUMN: MAP CARD AND OVERVIEW PANELS */}
      <div className="flex flex-1 flex-col gap-5 min-w-0">
        {/* MAP CONTAINER CARD */}
        <div className="relative h-[380px] lg:h-auto lg:flex-1 w-full rounded-3xl border border-gray-200/80 bg-white shadow-sm overflow-hidden flex flex-col shrink-0">
          {/* MAP CARD CONTROLS: "MAP VIEW" PILL AND VERTICALLY STACKED ACTION BUTTONS */}
        <div className="absolute top-5 inset-x-5 z-[1000] flex items-start justify-between pointer-events-none">
          <span className="rounded-xl bg-white/95 px-4 py-2 text-xs font-bold tracking-tight text-gray-800 shadow-sm backdrop-blur-md pointer-events-auto">
            Map View
          </span>

          {/* TOP RIGHT CONTROLS: POSITIONED TO STACK UNDER SMARTMAP'S LAYER TOGGLE */}
          <div className="flex flex-col items-center gap-2 pointer-events-auto pt-12">
            <button
              type="button"
              onClick={() => void detectGps()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-gray-700 shadow-sm backdrop-blur-md hover:text-gray-900 transition-colors pointer-events-auto"
              title="Locate Current Position"
            >
              <Crosshair className="h-4 w-4" />
            </button>
          </div>
        </div>

          {/* MAP CANVAS */}
          <div className="relative flex-1 w-full h-full min-h-[300px]">
            <SmartMap
              center={mapCenter}
              zoom={15}
              markers={mapMarkers}
              routes={mapRoutes}
              isCollecting={isCollecting}
              className="absolute inset-0 h-full w-full"
            />

            {/* IN-MAP NAVIGATION MANEUVER BANNER */}
            <div className="absolute bottom-5 left-5 right-5 z-[1000] max-w-sm pointer-events-none">
              <div className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-[#0a1811]/95 p-4 shadow-2xl backdrop-blur-md text-white pointer-events-auto">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#173827] text-white">
                  <CornerUpRight className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black tracking-wider text-emerald-400 uppercase">
                    IN 450 METERS
                  </p>
                  <p className="truncate text-xs font-bold text-gray-100 mt-0.5">
                    {activeStop ? `Turn Right onto ${activeStop.name}` : "Proceed along route"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DESKTOP BOTTOM METADATA CARDS */}
        <div className="hidden lg:grid grid-cols-2 gap-5 h-44 shrink-0">
          {/* ROUTE OVERVIEW CARD */}
          <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-black tracking-widest text-gray-400 uppercase">
                ROUTE OVERVIEW
              </p>
              <h3 className="text-xl font-black text-gray-900 mt-1">
                {assignedRoute?.routeDisplayNumber ?? "Route 1"} - {totalDistanceKm} km
              </h3>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mt-1.5">
                <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="truncate">
                  {gpsAddress !== "Detecting location..."
                    ? gpsAddress
                    : (assignedRoute?.barangay ?? "Cavite Region")}
                </span>
              </div>
            </div>
            <p className="text-xs font-medium text-gray-400 mt-2">
              2.8 km from last collection point
            </p>
          </div>

          {/* DESTINATION POINT CARD: BORDERLESS LOWER BASELINE */}
          <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black tracking-widest text-gray-400 uppercase">
                  DESTINATION POINT
                </p>
                <h3 className="text-xl font-black text-gray-900 truncate mt-1">
                  {stops[stops.length - 1]?.name ?? "Industrial Park Hub"}
                </h3>
                <p className="truncate text-xs font-semibold text-gray-600 mt-1">
                  {assignedRoute?.barangay ?? "Cavite"} • {assignedRoute?.wasteType ?? "Regular"} Waste Facility
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                GENERAL ETC
              </span>
              <span className="text-sm font-black text-gray-900">
                {assignedRoute?.startTime ?? "01:05 PM"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: DAILY SCHEDULE AND STACKED ACTIONS */}
      <div className="z-10 flex w-full flex-col rounded-3xl border border-gray-200/80 bg-white shadow-sm overflow-hidden lg:w-[420px] shrink-0 mt-5 lg:mt-0">
        {/* SCHEDULE HEADER */}
        <div className="border-b border-gray-100 p-6">
          <h2 className="text-xl font-black tracking-tight text-gray-900">Daily Schedule</h2>
          <p className="text-xs font-semibold text-gray-400 mt-1">
            {stops.length} Collections • 3.2 tons est.
          </p>
        </div>

        {/* STOP CHECKLIST: EXPANDED CARD SPACING */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6 min-h-[280px]">
          {isGeocodingStops && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Resolving Waypoint Coordinates...</span>
            </div>
          )}

          {isLoadingRoute ? (
            <div className="flex h-44 flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              <p className="text-xs font-semibold text-gray-400">Loading schedule...</p>
            </div>
          ) : !assignedRoute ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
              <AlertCircle className="mb-2 h-6 w-6 text-amber-600" />
              <h4 className="text-sm font-bold text-gray-800">No Route Assigned</h4>
              <p className="mt-1 text-xs text-gray-400">
                Check in with your hauling coordinator to receive an assignment.
              </p>
            </div>
          ) : stops.length === 0 ? (
            <div className="flex h-44 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
              <Navigation className="mb-2 h-6 w-6 text-gray-300" />
              <p className="text-xs font-bold text-gray-400">No collection waypoints defined.</p>
            </div>
          ) : (
            stops.map((stop, idx) => {
              const isCurrent = stop.status === "active";
              const isDone = stop.status === "completed";
              const formattedIndex = String(idx + 1).padStart(2, "0");

              // OPERATIONAL SUBTEXT: HOUSEHOLD COUNT AND AREA CLASSIFICATION
              const subtext = `${(idx + 1) * 6 + 6} households • Residential Area`;

              // ACTIVE STOP: TALL DEEP GREEN CARD WITH WHITE NOW PILL
              if (isCurrent && isCollecting) {
                return (
                  <div
                    key={stop.id}
                    className="relative flex min-h-[92px] items-center justify-between gap-4 rounded-2xl bg-[#0c1f17] p-5 text-white shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#173827] text-xs font-black text-white">
                        {formattedIndex}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-white">{stop.name}</p>
                        <p className="truncate text-xs font-medium text-gray-400 mt-1">
                          {subtext}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-3.5 py-1 text-[10px] font-black tracking-wider text-gray-900 uppercase shadow">
                      NOW
                    </span>
                  </div>
                );
              }

              // COMPLETED STOP: TALL LIGHT CARD WITH GREEN ACCENT STRIPE AND TIMESTAMP
              if (isDone) {
                return (
                  <div
                    key={stop.id}
                    className="relative flex min-h-[92px] items-center justify-between gap-4 rounded-2xl border-y border-r border-gray-100 border-l-4 border-l-emerald-600 bg-white p-5 shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0c1f17] text-xs font-black text-white">
                        {formattedIndex}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-gray-900">{stop.name}</p>
                        <p className="truncate text-xs font-medium text-gray-400 mt-1">
                          {subtext}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#0c1f17] px-3 py-1 text-[10px] font-black tracking-wider text-emerald-400 uppercase">
                      DONE • {stop.completedAt ?? "08:30 AM"}
                    </span>
                  </div>
                );
              }

              // IDENTIFY IF THIS STOP IS THE IMMEDIATE TRANSITION STOP
              const isImmediateNext =
                (!isCollecting && idx === 0) ||
                (isCollecting && stops.findIndex((s) => s.status === "active") === idx);

              // UPCOMING STOP CARD: HEIGHTENED WITH SUBTEXT
              return (
                <div
                  key={stop.id}
                  className="relative flex min-h-[92px] items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-400">
                      {formattedIndex}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-800">{stop.name}</p>
                      <p className="truncate text-xs font-medium text-gray-400 mt-1">
                        {subtext}
                      </p>
                    </div>
                  </div>

                  {/* ONLY THE IMMEDIATE TRANSITION STOP GETS THE PEACH BADGE */}
                  {isImmediateNext && (
                    <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold tracking-wider text-amber-700 uppercase">
                      IN PROGRESS
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* BOTTOM ACTION BUTTONS: TITLE CASE FIGMA STACK */}
        {assignedRoute && (
          <div className="border-t border-gray-100 p-6 flex flex-col gap-3">
            {routeCompleted ? (
              <div className="flex flex-col gap-2">
                <div className="rounded-2xl bg-emerald-50 p-3 text-center">
                  <p className="text-xs font-bold text-emerald-800">
                    All stops completed successfully.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void loadAssignedRoute(true)}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Reset Run
                </button>
              </div>
            ) : !isCollecting ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsCollecting(true);
                    void detectGps();
                    toast.success("Collection route started.");
                  }}
                  disabled={stops.length === 0}
                  className="h-13 w-full rounded-2xl bg-emerald-600 text-xs font-black tracking-widest text-white uppercase shadow-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  Start Collection Route
                </button>
                <button
                  type="button"
                  onClick={() => void loadAssignedRoute(true)}
                  className="h-10 w-full rounded-2xl text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Refresh Route
                </button>
              </>
            ) : allStopsDone ? (
              <button
                type="button"
                onClick={() => {
                  setIsCollecting(false);
                  setRouteCompleted(true);
                  toast.success("All stops completed! Route finished.");
                }}
                className="h-13 w-full rounded-2xl bg-[#0c1f17] text-xs font-black tracking-widest text-white uppercase shadow-lg hover:bg-[#133225] transition-colors"
              >
                Finish Route
              </button>
            ) : (
              <>
                {/* PRIMARY ACTION: MARK AS COMPLETE */}
                <button
                  type="button"
                  onClick={() => {
                    if (activeStop) {
                      markStopCompleted(activeStop.id);
                    }
                  }}
                  disabled={!activeStop}
                  className="h-13 w-full rounded-2xl bg-[#0c1f17] text-sm font-bold text-white shadow-md hover:bg-[#133225] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>Mark as Complete</span>
                </button>

                {/* SECONDARY ACTION: REPORT ISSUE AT THIS STOP */}
                <button
                  type="button"
                  onClick={() => {
                    toast.error(`Issue report logged for ${activeStop?.name ?? "current stop"}.`);
                  }}
                  className="h-13 w-full rounded-2xl bg-[#c5221f] text-sm font-bold text-white shadow-md hover:bg-[#a51b18] transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquareWarning className="h-4 w-4" />
                  <span>Report Issue at this Stop</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}