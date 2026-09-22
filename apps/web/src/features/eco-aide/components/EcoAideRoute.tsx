"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DashboardCard, Button, StatusBadge } from "@bazoora/ui";
import SmartMap from "@/components/map/smart-map";
import {
  Navigation,
  MapPin,
  Calendar,
  Clock,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
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
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const LOCAL_CENTER: [number, number] = [14.3833, 120.8833];

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

    setStops((prev) => {
      const next = [...prev];
      const idx = next.findIndex((s) => s.id === stopId);
      if (idx !== -1) {
        next[idx] = { ...next[idx], status: "completed" };
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
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-white lg:flex-row">
      <LocationPermissionModal onAllow={detectGps} />

      {/* MAP VIEWPORT CONTAINER WITH EXPLICIT DIMENSIONS */}
      <div className="relative h-[50vh] w-full flex-1 lg:h-full lg:min-h-0">
        <SmartMap
          center={mapCenter}
          zoom={15}
          markers={mapMarkers}
          routes={mapRoutes}
          isCollecting={isCollecting}
          className="absolute inset-0 h-full w-full"
        />

        {/* TOP STATUS OVERLAY */}
        <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-3">
          <DashboardCard className="flex items-center gap-3 border-gray-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-md">
            <div
              className={`h-3 w-3 rounded-full ${
                routeCompleted
                  ? "bg-emerald-500"
                  : isCollecting
                  ? "animate-pulse bg-emerald-500"
                  : "bg-amber-500"
              }`}
            />
            <div className="min-w-0">
              <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                {routeCompleted
                  ? "Route Completed"
                  : isCollecting
                  ? "Active Collection"
                  : "Route Standby"}
              </p>
              <p className="truncate text-xs font-bold text-gray-900">{gpsAddress}</p>
            </div>
          </DashboardCard>
        </div>
      </div>

      {/* SIDEBAR DETAILS & CONTROLS */}
      <div className="z-10 flex w-full flex-col border-l border-gray-100 bg-white shadow-2xl lg:w-[400px]">
        {/* HEADER SECTION */}
        <div className="flex flex-col gap-3 border-b border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-gray-900">
                  {assignedRoute?.routeDisplayNumber ?? "Assigned Route"}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void loadAssignedRoute(true)}
                  disabled={isLoadingRoute}
                  className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700 disabled:opacity-50"
                  title="Refresh Route"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingRoute ? "animate-spin" : ""}`} />
                </Button>
              </div>
              <p className="text-sm font-semibold text-gray-500">
                {assignedRoute?.name ?? "No active route assignment"}
              </p>
            </div>
            <StatusBadge
              status={
                isLoadingRoute
                  ? "Loading..."
                  : routeCompleted
                  ? "Completed"
                  : assignedRoute
                  ? isCollecting
                    ? "In Progress"
                    : assignedRoute.status
                  : "Unassigned"
              }
            />
          </div>

          {assignedRoute && (
            <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl border border-gray-100 bg-gray-50/70 p-3">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span className="truncate font-medium">{assignedRoute.barangay}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Trash2 className="h-4 w-4 text-emerald-600" />
                <span className="truncate font-medium">{assignedRoute.wasteType}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Calendar className="h-4 w-4 text-emerald-600" />
                <span className="truncate font-medium">{assignedRoute.collectionDay}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Clock className="h-4 w-4 text-emerald-600" />
                <span className="truncate font-medium">{assignedRoute.startTime}</span>
              </div>
            </div>
          )}
        </div>

        {/* STOP SEQUENCE CHECKLIST */}
        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black tracking-wider text-gray-400 uppercase">
              Waypoints & Stops ({stops.length})
            </h3>
            {isGeocodingStops && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <Loader2 className="h-3 w-3 animate-spin" /> Resolving Map Coordinates...
              </span>
            )}
          </div>

          {isLoadingRoute ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              <p className="text-xs font-semibold text-gray-400">Loading route details...</p>
            </div>
          ) : !assignedRoute ? (
            <div className="flex h-56 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-100 bg-gray-50/50 p-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <h4 className="text-sm font-bold text-gray-800">No Route Assigned</h4>
              <p className="mt-1 text-xs text-gray-400">
                You do not have a collection route assigned yet. Please check in with your hauling coordinator.
              </p>
            </div>
          ) : stops.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-100 bg-gray-50/50 p-6 text-center">
              <Navigation className="mb-2 h-6 w-6 text-gray-300" />
              <p className="text-xs font-bold text-gray-400">No collection waypoints defined.</p>
            </div>
          ) : (
            stops.map((stop, idx) => {
              const isCurrent = stop.status === "active";
              const isDone = stop.status === "completed";

              return (
                <DashboardCard
                  key={stop.id}
                  className={`overflow-hidden rounded-2xl border-gray-200 transition-all ${
                    isCurrent && isCollecting
                      ? "border-emerald-500 shadow-md ring-1 ring-emerald-500"
                      : "bg-gray-50/40"
                  }`}
                >
                  <div className="flex items-center gap-3.5 p-4">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                        isDone
                          ? "bg-emerald-600 text-white"
                          : isCurrent && isCollecting
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-gray-900">{stop.name}</p>
                      <p className="truncate text-xs font-medium text-gray-400">{stop.address}</p>
                    </div>

                    {isCurrent && isCollecting && (
                      <Button
                        size="sm"
                        onClick={() => markStopCompleted(stop.id)}
                        className="h-8 rounded-xl bg-emerald-600 px-3 text-[11px] font-bold text-white shadow-sm"
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </DashboardCard>
              );
            })
          )}
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        {assignedRoute && (
          <div className="border-t border-gray-100 p-6">
            {routeCompleted ? (
              <div className="flex flex-col gap-2">
                <div className="rounded-2xl bg-emerald-50 p-3 text-center">
                  <p className="text-xs font-bold text-emerald-800">All stops completed successfully.</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => void loadAssignedRoute(true)}
                  className="h-11 w-full rounded-2xl text-xs font-bold text-gray-600"
                >
                  Reset Run
                </Button>
              </div>
            ) : !isCollecting ? (
              <Button
                onClick={() => {
                  setIsCollecting(true);
                  void detectGps();
                  toast.success("Collection route started.");
                }}
                disabled={stops.length === 0}
                className="h-13 w-full rounded-2xl bg-emerald-600 text-xs font-black tracking-widest text-white uppercase shadow-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                Start Collection Route
              </Button>
            ) : allStopsDone ? (
              <Button
                onClick={() => {
                  setIsCollecting(false);
                  setRouteCompleted(true);
                  toast.success("All stops completed! Route finished.");
                }}
                className="h-13 w-full rounded-2xl bg-[#0f2419] text-xs font-black tracking-widest text-white uppercase shadow-lg"
              >
                Finish Route
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    if (activeStop) {
                      markStopCompleted(activeStop.id);
                    }
                  }}
                  disabled={!activeStop}
                  className="h-13 w-full rounded-2xl bg-[#0f2419] text-xs font-black tracking-widest text-white uppercase shadow-lg"
                >
                  Mark Active Stop Completed
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsCollecting(false);
                    toast.info("Collection paused.");
                  }}
                  className="h-9 w-full text-xs font-bold text-gray-400 hover:text-gray-600"
                >
                  Pause Collection
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
