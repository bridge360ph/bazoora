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
  Crosshair,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCcw,
  X,
  Camera,
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

// 50-METER PROXIMITY THRESHOLD FOR STOP VERIFICATION
const PROXIMITY_THRESHOLD_M = 50;

// CALCULATE HAVERSINE DISTANCE IN METERS BETWEEN TWO COORDINATE PAIRS
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

  // INCIDENT REPORT STATE
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [reportCategory, setReportCategory] = useState<string>("Blocked Access");
  const [reportNotes, setReportNotes] = useState<string>("");
  const [reportPhotoName, setReportPhotoName] = useState<string>("");
  const [reportPhotoPreview, setReportPhotoPreview] = useState<string | null>(null);

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

              let results = await geocode(`${stopName}, ${currentAssigned.barangay}`, {
                limit: 1,
                countryCodes: "ph",
              });
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

    const targetStop = stops.find((s) => s.id === stopId);
    if (!targetStop) return;

    // ENFORCE 50-METER PROXIMITY CHECK
    const distMeters = gpsPos
      ? haversineMeters(gpsPos[0], gpsPos[1], targetStop.lat, targetStop.lng)
      : Infinity;

    // LOCAL DEV OVERRIDE VIA LOCALSTORAGE FOR REMOTE TESTING
    const bypassProximity =
      typeof window !== "undefined" &&
      localStorage.getItem("bazoora_bypass_proximity") === "true";

    if (distMeters > PROXIMITY_THRESHOLD_M && !bypassProximity) {
      const formattedDist =
        distMeters === Infinity
          ? "Unknown distance"
          : distMeters >= 1000
            ? `${(distMeters / 1000).toFixed(1)} km away`
            : `${Math.round(distMeters)}m away`;
      toast.error(
        `Proximity Check Failed: Must be within 50m of ${targetStop.name} to complete collection (${formattedDist}).`
      );
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
    toast.success(`Marked ${targetStop.name} as collected.`);
  };

  // HANDLE PHOTO SELECTION AND CREATE PREVIEW OBJECT URL
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReportPhotoName(file.name);
      const previewUrl = URL.createObjectURL(file);
      setReportPhotoPreview(previewUrl);
    }
  };

  // CLEAR SELECTED PHOTO AND REVOKE PREVIEW MEMORY
  const handleClearPhoto = () => {
    if (reportPhotoPreview) {
      URL.revokeObjectURL(reportPhotoPreview);
    }
    setReportPhotoName("");
    setReportPhotoPreview(null);
  };

  // SUBMIT INCIDENT REPORT AND RESET FORM
  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportNotes.trim()) {
      toast.info("Add descriptive notes before submitting.");
      return;
    }
    toast.success(`Incident recorded for ${activeStop?.name ?? "Route"}.`);
    setReportNotes("");
    handleClearPhoto();
    setIsReportOpen(false);
  };

  const isResolvingRoute = isLoadingRoute || isGeocodingStops;
  const activeStop = stops.find((s) => s.status === "active");
  const completedStopsCount = stops.filter((s) => s.status === "completed").length;
  const allStopsDone = stops.length > 0 && completedStopsCount === stops.length;
  const progressPercent = stops.length > 0 ? Math.round((completedStopsCount / stops.length) * 100) : 0;

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
    <div className="relative flex w-full flex-col font-['Inter',sans-serif] bg-[#f4f6f8] pb-44">
      <LocationPermissionModal onAllow={detectGps} />

      {/* FULL MOBILE MAP VIEWPORT: ISOLATE CREATES LOCAL STACKING CONTEXT SO OVERLAYS NEVER ESCAPE OVER THE HEADER */}
      <div className="relative h-[44vh] min-h-[290px] w-full bg-[#11241a] overflow-hidden shrink-0 shadow-inner isolate">
        {/* TOP STATUS PILL */}
        <div className="absolute top-3.5 left-3.5 z-10 pointer-events-auto">
          <div className="flex items-center gap-2 rounded-full bg-[#0a1811]/90 border border-white/15 px-3 py-1.5 shadow-md backdrop-blur-md">
            {isResolvingRoute ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                  Syncing Route
                </span>
              </>
            ) : (
              <>
                <Radio
                  className={`w-3.5 h-3.5 ${
                    isCollecting ? "text-emerald-400 animate-pulse" : "text-gray-400"
                  }`}
                />
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-200">
                  {isCollecting ? "Live Tracking" : "Route Ready"}
                </span>
              </>
            )}
          </div>
        </div>

        {/* LOCATE POSITION BUTTON: NEATLY STACKED UNDER SMARTMAP'S LAYER SWITCHER */}
        <div className="absolute top-[54px] right-3.5 z-10 pointer-events-auto">
          <button
            type="button"
            onClick={() => void detectGps()}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-800 shadow-md backdrop-blur-md hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
            title="Locate Position"
          >
            <Crosshair className="h-4 w-4 text-slate-700" />
          </button>
        </div>

        {/* MAP CANVAS */}
        <SmartMap
          center={mapCenter}
          zoom={15}
          markers={mapMarkers}
          routes={mapRoutes}
          isCollecting={isCollecting}
          className="absolute inset-0 h-full w-full"
        />

        {/* FLOATING TURN MANEUVER HUD: ONLY VISIBLE WHILE COLLECTION ROUTE IS ACTIVELY RUNNING */}
        {isCollecting && activeStop && (
          <div className="absolute bottom-2.5 inset-x-3 z-10 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-[#0a1811]/95 px-4 py-2.5 shadow-xl backdrop-blur-md text-white pointer-events-auto">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-inner">
                <CornerUpRight className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black tracking-widest text-emerald-400 uppercase">
                    IN 450 METERS
                  </span>
                  <span className="text-[9px] text-gray-400 font-semibold">• Turn-by-Turn</span>
                </div>
                <p className="truncate text-xs font-black text-white mt-0.5">
                  Turn right toward {activeStop.name}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* OPERATIONAL SUMMARY SECTION */}
      <div className="p-4 space-y-4">
        {/* HERO TELEMETRY CARD */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1 pr-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                  {assignedRoute?.routeDisplayNumber ?? "RT-001"}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {assignedRoute?.wasteType ?? "Regular"} Waste
                </span>
              </div>
              <h1 className="text-base font-black text-slate-900 mt-2 truncate">
                {isCollecting && activeStop
                  ? activeStop.name
                  : (assignedRoute?.name ?? "Daily Hauling Corridor")}
              </h1>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mt-1">
                <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">
                  {gpsAddress !== "Detecting location..." ? gpsAddress : (assignedRoute?.barangay ?? "Cavite Region")}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-base font-black text-slate-900">{totalDistanceKm} km</span>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Est. Length</p>
            </div>
          </div>

          {/* DYNAMIC PROGRESS STRIP */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between text-xs font-black text-slate-700 mb-1.5">
              <span>Collection Progress</span>
              <span className="text-emerald-700">
                {completedStopsCount} of {stops.length} Stops ({progressPercent}% Done)
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* ASSIGNED STOPS LIST */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black tracking-wider uppercase text-slate-600">
              Assigned Checkpoints
            </h2>
            <span className="text-xs font-bold text-slate-400">
              {stops.length} Stops Total
            </span>
          </div>

          {isGeocodingStops && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold">
              <Loader2 className="h-4 w-4 animate-spin shrink-0 text-emerald-600" />
              <span>Resolving street coordinates from dispatch...</span>
            </div>
          )}

          {isLoadingRoute ? (
            <div className="flex h-36 flex-col items-center justify-center gap-2 rounded-3xl bg-white border border-slate-200/80 p-6 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              <p className="text-xs font-bold text-slate-500">Loading daily checkpoints...</p>
            </div>
          ) : !assignedRoute ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
              <AlertCircle className="mb-2 h-7 w-7 text-amber-500" />
              <h3 className="text-sm font-black text-slate-800">No Route Assigned</h3>
              <p className="mt-1 text-xs text-slate-400 max-w-xs">
                Check in with your hauling coordinator to receive a daily assignment.
              </p>
            </div>
          ) : stops.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
              <Navigation className="mb-2 h-7 w-7 text-slate-300" />
              <p className="text-xs font-bold text-slate-400">No collection checkpoints found.</p>
            </div>
          ) : (
            stops.map((stop, idx) => {
              const isCurrent = stop.status === "active";
              const isDone = stop.status === "completed";
              const formattedIndex = String(idx + 1).padStart(2, "0");
              const householdsEst = (idx + 1) * 8 + 4;

              // CURRENT ACTIVE STOP CARD
              if (isCurrent && isCollecting) {
                return (
                  <div
                    key={stop.id}
                    className="relative flex items-center justify-between gap-3.5 rounded-2xl bg-[#0a1811] p-4 text-white shadow-md ring-2 ring-emerald-500/50"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-sm font-black text-[#0a1811] shadow">
                        {formattedIndex}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-black text-white">{stop.name}</p>
                          <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[9px] font-black text-emerald-300 uppercase tracking-wider">
                            ACTIVE
                          </span>
                        </div>
                        <p className="truncate text-xs font-medium text-gray-300 mt-0.5">
                          {householdsEst} households • Residential Sector
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              // COMPLETED CHECKPOINT CARD
              if (isDone) {
                return (
                  <div
                    key={stop.id}
                    className="relative flex items-center justify-between gap-3 rounded-2xl bg-white border border-emerald-100 p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-700 line-through decoration-slate-300">
                          {stop.name}
                        </p>
                        <p className="truncate text-xs font-semibold text-emerald-700 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Collected at {stop.completedAt ?? "08:30 AM"}</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black tracking-wider uppercase text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">
                      DONE
                    </span>
                  </div>
                );
              }

              // UPCOMING QUEUED STOP CARD
              return (
                <div
                  key={stop.id}
                  className="relative flex items-center justify-between gap-3 rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-400">
                      {formattedIndex}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800">{stop.name}</p>
                      <p className="truncate text-xs font-medium text-slate-400 mt-0.5">
                        {householdsEst} households • Pending Arrival
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* PERSISTENT STICKY EXECUTION DOCK: DOCKED DIRECTLY ABOVE ECOAIDEMOBILENAV */}
      {assignedRoute && (
        <div className="fixed bottom-20 inset-x-0 z-20 p-3 bg-white/95 border-t border-slate-200/90 shadow-2xl backdrop-blur-md">
          {routeCompleted ? (
            <button
              type="button"
              onClick={() => void loadAssignedRoute(true)}
              className="h-12 w-full rounded-2xl bg-emerald-700 text-xs font-black tracking-wider text-white uppercase shadow-md active:scale-[0.99] transition-transform flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.2]" />
              <span>Reset Route Run</span>
            </button>
          ) : !isCollecting ? (
            <button
              type="button"
              onClick={() => {
                setIsCollecting(true);
                void detectGps();
                toast.success("Collection route initiated.");
              }}
              disabled={stops.length === 0}
              className="h-12 w-full rounded-2xl bg-emerald-600 text-xs font-black tracking-widest text-white uppercase shadow-lg hover:bg-emerald-700 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
            >
              Start Collection Route
            </button>
          ) : allStopsDone ? (
            <button
              type="button"
              onClick={() => {
                setIsCollecting(false);
                setRouteCompleted(true);
                toast.success("Route completed!");
              }}
              className="h-12 w-full rounded-2xl bg-[#0a1811] text-xs font-black tracking-widest text-white uppercase shadow-lg active:scale-[0.99] transition-transform flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Finish Collection Route</span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setIsReportOpen(true)}
                className="h-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-black flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>Report Issue</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (activeStop) markStopCompleted(activeStop.id);
                }}
                disabled={!activeStop}
                className="h-12 rounded-2xl bg-emerald-600 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-transform disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Complete Stop</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* INCIDENT REPORT BOTTOM SHEET: FLUSH AT BOTTOM AND SIDES */}
      {isReportOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end"
          onClick={() => {
            handleClearPhoto();
            setIsReportOpen(false);
          }}
        >
          <form
            onSubmit={handleReportSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-h-[85vh] overflow-y-auto flex flex-col rounded-t-[28px] bg-white border-t border-slate-200 p-5 pb-8 text-slate-900 shadow-2xl animate-in slide-in-from-bottom duration-200 space-y-4"
          >
            {/* TACTILE GRAB PILL */}
            <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto -mt-1 mb-2 shrink-0" />

            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-sm font-black uppercase tracking-wide">
                  Report Incident or Obstacle
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleClearPhoto();
                  setIsReportOpen(false);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Issue Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Blocked Access",
                  "Absent Bin",
                  "Hazardous Waste",
                  "Collector Delay",
                ].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setReportCategory(cat)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-colors cursor-pointer ${
                      reportCategory === cat
                        ? "bg-red-600 text-white border-red-600 shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Location Target
              </label>
              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                {activeStop
                  ? `${activeStop.name} (${activeStop.address})`
                  : gpsAddress}
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Obstacle Details or Notes
              </label>
              <textarea
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                placeholder="Describe road blockage, bin issue, or reason for delay..."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/10 min-h-[75px]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Photo Evidence
              </label>

              {reportPhotoPreview ? (
                <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group">
                  <img
                    src={reportPhotoPreview}
                    alt="Incident preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
                  <div className="absolute top-2.5 right-2.5">
                    <button
                      type="button"
                      onClick={handleClearPhoto}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black active:scale-95 transition-all cursor-pointer"
                      title="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-3 right-3 truncate text-[11px] font-medium text-white/90">
                    {reportPhotoName}
                  </div>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-100">
                  <Camera className="w-4 h-4 text-slate-400" />
                  <span>Capture or Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </label>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-red-600 text-white text-xs font-black uppercase tracking-wider shadow-lg active:scale-98 transition-transform cursor-pointer"
            >
              Submit Report
            </button>
          </form>
        </div>
      )}
    </div>
  );
}