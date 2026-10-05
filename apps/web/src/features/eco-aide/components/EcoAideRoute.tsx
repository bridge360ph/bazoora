"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SmartMap from "@/components/map/smart-map";
import {
  Loader2,
  Check,
  Crosshair,
  AlertTriangle,
  Radio,
  Sparkles,
  Layers,
  Bell,
  ListOrdered,
  BarChart3,
  X,
  Camera,
  Archive,
  Play,
  ChevronUp,
  CheckCircle2,
  RotateCcw,
  CornerUpRight,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { geocode, reverseGeocode } from "@/lib/geocoding";
import { LocationPermissionModal } from "@/components/ui/location-permission";
import { fetchRoutes } from "@/features/route-management/routeService";
import type { Route } from "@bazoora/shared";
import type { MapMarker, MapRoute } from "@/components/map/smart-map";

interface RouteStop {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: "pending" | "active" | "completed";
  completedAt?: string;
}

interface DispatchAlert {
  id: string;
  title: string;
  message: string;
  time: string;
  priority: "high" | "normal";
  read: boolean;
}

interface ActionNotice {
  id: string;
  title: string;
  message: string;
  type: "success" | "info" | "error";
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
  const navigate = useNavigate();
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

  // SPEED DIAL AND BOTTOM DRAWER STATE
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState<boolean>(false);
  const [activeSheet, setActiveSheet] = useState<
    "checkpoints" | "alerts" | "metrics" | "report" | null
  >(null);

  // IN-MAP ACTION BANNER (REPLACES INTRUSIVE TOAST)
  const [actionNotice, setActionNotice] = useState<ActionNotice | null>(null);

  const triggerNotice = useCallback(
    (title: string, message: string, type: "success" | "info" | "error" = "success") => {
      setActionNotice({
        id: Date.now().toString(),
        title,
        message,
        type,
      });
    },
    [],
  );

  // AUTO-DISMISS IN-MAP ACTION BANNER AFTER 3.5 SECONDS
  useEffect(() => {
    if (!actionNotice) return;
    const timer = setTimeout(() => {
      setActionNotice(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [actionNotice]);

  // HEADS-UP DISPATCH ALERT WITH AUTO-DISMISS AND HORIZONTAL SWIPE
  const [urgentAlert, setUrgentAlert] = useState<DispatchAlert | null>(null);
  const [alertOffsetX, setAlertOffsetX] = useState<number>(0);
  const touchAlertStartX = useRef<number>(0);

  const [alertsList, setAlertsList] = useState<DispatchAlert[]>([
    {
      id: "alert-001",
      title: "Alley Obstruction on Mendoza St",
      message: "Utility repairs blocking heavy vehicle lane. Use alternate pass.",
      time: "2 mins ago",
      priority: "high",
      read: false,
    },
    {
      id: "alert-002",
      title: "Reroute Advisory: San Agustin",
      message: "Secondary market area cleared for waste collection.",
      time: "15 mins ago",
      priority: "normal",
      read: false,
    },
  ]);

  // INCIDENT REPORT STATE ALIGNED WITH PR 109
  const [reportCategory, setReportCategory] = useState<string>("Blocked Access");
  const [reportNotes, setReportNotes] = useState<string>("");
  const [reportPhotoName, setReportPhotoName] = useState<string>("");
  const [reportPhotoPreview, setReportPhotoPreview] = useState<string | null>(null);

  const hasLoadedRef = useRef<boolean>(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    gpsPosRef.current = gpsPos;
  }, [gpsPos]);

  // AUTO-DISMISS URGENT ALERT BANNER AFTER 7 SECONDS
  useEffect(() => {
    if (!urgentAlert) return;
    const timer = setTimeout(() => {
      setUrgentAlert(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [urgentAlert]);

  // GEOLOCATION DETECTION HANDLER
  const detectGps = useCallback((): Promise<[number, number] | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords: [number, number] = [
            pos.coords.latitude,
            pos.coords.longitude,
          ];
          setGpsPos(coords);
          gpsPosRef.current = coords;

          try {
            const res = await reverseGeocode(coords[0], coords[1]);
            setGpsAddress(
              res.display_name ??
                `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`,
            );
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
          (r) =>
            r.assignedEcoAideId === user.id ||
            r.assignedEcoAide?.id === user.id,
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

              let results = await geocode(
                `${stopName}, ${currentAssigned.barangay}`,
                {
                  limit: 1,
                  countryCodes: "ph",
                },
              );
              let match = results?.[0];

              if (!match) {
                results = await geocode(stopName, {
                  limit: 1,
                  countryCodes: "ph",
                });
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
        triggerNotice("Error", "Failed to fetch assigned route.", "error");
      } finally {
        setIsLoadingRoute(false);
      }
    },
    [user?.id, detectGps, triggerNotice],
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
        const coords: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        setGpsPos(coords);
        gpsPosRef.current = coords;
        try {
          const res = await reverseGeocode(coords[0], coords[1]);
          setGpsAddress(
            res.display_name ??
              `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`,
          );
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
      triggerNotice("Notice", "Start the collection route first.", "info");
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
      triggerNotice(
        "Proximity Check Failed",
        `Must be within 50m of ${targetStop.name} to complete collection (${formattedDist}).`,
        "error"
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

    triggerNotice(
      "Stop Completed",
      `Marked ${targetStop.name} as collected.`,
      "success"
    );
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

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportNotes.trim()) {
      triggerNotice("Notice", "Add descriptive notes before submitting.", "info");
      return;
    }
    triggerNotice(
      "Report Logged",
      `Incident recorded for ${activeStop?.name ?? "Route"}.`,
      "success",
    );
    setReportNotes("");
    handleClearPhoto();
    setActiveSheet(null);
  };

  const isResolvingRoute = isLoadingRoute || isGeocodingStops;
  const activeStop = stops.find((s) => s.status === "active");
  const activeStopIndex = stops.findIndex((s) => s.status === "active");
  const completedStopsCount = stops.filter(
    (s) => s.status === "completed",
  ).length;
  const allStopsDone =
    stops.length > 0 && completedStopsCount === stops.length;
  const progressPercent =
    stops.length > 0
      ? Math.round((completedStopsCount / stops.length) * 100)
      : 0;

  const totalDistanceKm = useMemo(() => calculateRouteDistance(stops), [stops]);
  const unreadAlertsCount = alertsList.filter((a) => !a.read).length;

  const mapCenter: [number, number] =
    gpsPos ??
    (stops.length > 0 ? [stops[0].lat, stops[0].lng] : LOCAL_CENTER);

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
              ...(gpsPos && isCollecting
                ? [[gpsPos[1], gpsPos[0]] as [number, number]]
                : []),
              ...activeWaypoints.map(
                (s) => [Number(s.lng), Number(s.lat)] as [number, number],
              ),
            ],
            color: "green",
            label: assignedRoute?.name ?? "Collection Route",
          },
        ]
      : [];

  // HORIZONTAL SWIPE DISMISS HANDLERS FOR ALERT BANNER
  const handleAlertTouchStart = (e: React.TouchEvent) => {
    touchAlertStartX.current = e.touches[0].clientX;
  };

  const handleAlertTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientX - touchAlertStartX.current;
    setAlertOffsetX(delta);
  };

  const handleAlertTouchEnd = () => {
    if (Math.abs(alertOffsetX) > 75) {
      setUrgentAlert(null);
    }
    setAlertOffsetX(0);
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#11241a] font-['Inter',sans-serif]">
      {/* GLOBAL INDETERMINATE PROGRESS KEYFRAME */}
      <style>{`
        @keyframes routeSetupSlide {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(260%);
          }
        }
      `}</style>

      <LocationPermissionModal onAllow={detectGps} />

      {/* FULL-SCREEN MAP CANVAS */}
      <SmartMap
        center={mapCenter}
        zoom={15}
        markers={mapMarkers}
        routes={mapRoutes}
        isCollecting={isCollecting}
        className="absolute inset-0 h-full w-full"
      />

      {/* AMBIENT BOTTOM VIGNETTE: BLENDS MAP CANVAS INTO FLOATING HUD */}
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-52 bg-gradient-to-t from-black/35 via-black/10 to-transparent z-[1001]" />

      {/* TOP HEADS-UP MANEUVER BANNER: ACTIVE DURING COLLECTION */}
      {isCollecting && activeStop ? (
        <div className="absolute top-3.5 left-3.5 right-16 z-[1000] pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3.5 rounded-2xl border border-white/15 bg-[#0a1811]/95 px-4 py-4 shadow-2xl backdrop-blur-md text-white">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-[#0a1811] shadow-inner">
              <CornerUpRight className="h-6 w-6 stroke-[2.6]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase block">
                IN 450 METERS
              </span>
              <p className="truncate text-sm font-black text-white mt-0.5">
                Turn right toward {activeStop.name}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* TOP STATUS PILL: IDLE STATE */
        <div className="absolute top-3.5 left-3.5 z-[1000] pointer-events-auto">
          <div className="flex items-center gap-2 rounded-full bg-[#0a1811]/90 border border-white/15 px-3.5 py-1.5 shadow-md backdrop-blur-md">
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
      )}

      {/* LOCATE POSITION BUTTON: DIRECTLY ALIGNED UNDER SMARTMAP LAYER TOGGLE */}
      <div className="absolute top-[58px] right-4 z-[1000] pointer-events-auto">
        <button
          type="button"
          onClick={() => void detectGps()}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-800 shadow-md backdrop-blur-md hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
          title="Locate Position"
        >
          <Crosshair className="h-4 w-4 text-slate-700" />
        </button>
      </div>

      {/* IN-MAP ACTION BANNER: SLEEK NATIVE POPUP ANCHORED BELOW TOP BAR */}
      {actionNotice && (
        <div
          className={`absolute ${
            isCollecting && activeStop ? "top-24" : "top-14"
          } left-3.5 right-16 z-[1002] pointer-events-auto animate-in fade-in slide-in-from-top-3 duration-200`}
        >
          <div
            className={`flex items-start justify-between gap-2.5 rounded-2xl bg-[#0a1811]/95 border-l-4 p-3 shadow-2xl backdrop-blur-md text-white border-white/10 ${
              actionNotice.type === "error"
                ? "border-l-red-500"
                : actionNotice.type === "info"
                ? "border-l-amber-500"
                : "border-l-emerald-500"
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${
                    actionNotice.type === "error"
                      ? "text-red-400"
                      : actionNotice.type === "info"
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                />
                <span className="text-[9px] font-black uppercase tracking-wider text-gray-300">
                  {actionNotice.title}
                </span>
              </div>
              <p className="text-xs font-medium text-white mt-0.5 leading-snug break-words">
                {actionNotice.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="text-gray-400 hover:text-white p-0.5 shrink-0 cursor-pointer"
              aria-label="Dismiss Notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* HEADS-UP URGENT DISPATCH BANNER */}
      {urgentAlert && !actionNotice && (
        <div
          className={`absolute ${
            isCollecting && activeStop ? "top-24" : "top-14"
          } left-3.5 right-16 z-[1001] pointer-events-auto transition-transform`}
          style={{ transform: `translateX(${alertOffsetX}px)` }}
          onTouchStart={handleAlertTouchStart}
          onTouchMove={handleAlertTouchMove}
          onTouchEnd={handleAlertTouchEnd}
        >
          <div className="flex items-start justify-between gap-2.5 rounded-2xl bg-[#0a1811]/95 border-l-4 border-l-amber-500 border-white/10 p-3 shadow-2xl backdrop-blur-md text-white">
            <div
              className="flex-1 cursor-pointer min-w-0"
              onClick={() => {
                setActiveSheet("alerts");
                setUrgentAlert(null);
              }}
            >
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[8.5px] font-black tracking-wider text-amber-300 uppercase">
                  Dispatch
                </span>
                <span className="text-[9px] text-gray-400">
                  {urgentAlert.time}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white mt-1 truncate">
                {urgentAlert.title}
              </h4>
              <p className="text-[10px] text-gray-300 line-clamp-1 mt-0.5">
                {urgentAlert.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setUrgentAlert(null)}
              className="text-gray-400 hover:text-white p-1 shrink-0"
              aria-label="Dismiss Alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SPEED DIAL EXPANDABLE POPOVER */}
      {isSpeedDialOpen && (
        <div
          className="fixed inset-0 z-[1010] bg-black/40 backdrop-blur-[2px] transition-opacity"
          onClick={() => setIsSpeedDialOpen(false)}
        >
          <div
            className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[330px] origin-bottom animate-in zoom-in-95 fade-in slide-in-from-bottom-2 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-hidden rounded-3xl bg-[#0a1811]/95 border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-2xl divide-y divide-white/10">
              {/* ACTION 1: CHECKPOINT QUEUE */}
              <button
                type="button"
                onClick={() => {
                  setActiveSheet("checkpoints");
                  setIsSpeedDialOpen(false);
                }}
                className="group flex w-full items-center justify-between p-3.5 text-left hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 group-hover:scale-105 transition-transform">
                    <ListOrdered className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-white block">
                      Checkpoint Queue
                    </span>
                    <span className="text-[11px] font-medium text-gray-400">
                      View remaining stops & sequence
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-800/40">
                    {completedStopsCount}/{stops.length}
                  </span>
                </div>
              </button>

              {/* ACTION 2: DISPATCH ALERTS */}
              <button
                type="button"
                onClick={() => {
                  setActiveSheet("alerts");
                  setIsSpeedDialOpen(false);
                }}
                className="group flex w-full items-center justify-between p-3.5 text-left hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 group-hover:scale-105 transition-transform">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-white block">
                      Alerts & Dispatches
                    </span>
                    <span className="text-[11px] font-medium text-gray-400">
                      Reroutes and road updates
                    </span>
                  </div>
                </div>
                {unreadAlertsCount > 0 && (
                  <span className="flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-[#0a1811] shadow">
                    {unreadAlertsCount}
                  </span>
                )}
              </button>

              {/* ACTION 3: SHIFT METRICS */}
              <button
                type="button"
                onClick={() => {
                  setActiveSheet("metrics");
                  setIsSpeedDialOpen(false);
                }}
                className="group flex w-full items-center justify-between p-3.5 text-left hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400 group-hover:scale-105 transition-transform">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-white block">
                      Route Metrics
                    </span>
                    <span className="text-[11px] font-medium text-gray-400">
                      Distance, payload, and progress
                    </span>
                  </div>
                </div>
                <span className="text-xs font-black text-blue-400">
                  {totalDistanceKm} km
                </span>
              </button>

              {/* ACTION 4: SWITCH TO COLLECTIONS VIEW */}
              <button
                type="button"
                onClick={() => {
                  setIsSpeedDialOpen(false);
                  navigate("/eco-aide/collections");
                }}
                className="group flex w-full items-center justify-between p-3.5 text-left hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-400 group-hover:scale-105 transition-transform">
                    <Archive className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-white block">
                      Collections Log
                    </span>
                    <span className="text-[11px] font-medium text-gray-400">
                      Historical log of daily pickups
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERSISTENT CO-PILOT HUD CARD */}
      <div className="absolute bottom-4 inset-x-3.5 z-[1005] pointer-events-auto">
        <div className="rounded-3xl bg-white/95 border border-white/60 p-4 shadow-[0_16px_40px_-10px_rgba(0,0,0,0.28)] backdrop-blur-xl flex flex-col gap-3.5">
          {/* HEADER STRIP: ACTIVE CHECKPOINT TITLE AND TELEMETRY SUMMARY */}
          <div
            onClick={() => {
              if (!isResolvingRoute) setActiveSheet("checkpoints");
            }}
            className="flex items-center justify-between cursor-pointer active:opacity-80 transition-opacity"
          >
            <div className="min-w-0 flex-1 pr-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
                <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  {assignedRoute?.routeDisplayNumber ?? "RT-001"}
                </span>
                <span>•</span>
                <span className="text-slate-600 truncate">
                  {isResolvingRoute
                    ? "Setting Up"
                    : isCollecting && activeStop
                    ? `Stop ${activeStopIndex + 1} of ${stops.length}`
                    : "Route Overview"}
                </span>
              </div>

              {/* DYNAMIC TITLE: RENDERS ACTIVE STOP WHEN RUNNING, ROUTE NAME WHEN IDLE OR LOADING */}
              <h3 className="text-lg font-black text-slate-900 truncate mt-1">
                {isCollecting && activeStop
                  ? activeStop.name
                  : (assignedRoute?.name ?? "Collection Route")}
              </h3>

              <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">
                {isResolvingRoute
                  ? "Resolving stops and waypoints..."
                  : isCollecting && activeStop
                  ? `${(activeStopIndex + 1) * 8 + 4} households • Residential Sector`
                  : `${stops.length} stops scheduled`}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {!isResolvingRoute ? (
                <>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 block">
                      {totalDistanceKm} km
                    </span>
                    <p className="text-xs font-bold text-emerald-600 mt-0.5">
                      {progressPercent}% Done
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 shadow-inner">
                    <ChevronUp className="w-5 h-5" />
                  </div>
                </>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                </div>
              )}
            </div>
          </div>

          {/* PROGRESS STRIP: CLEAN INDETERMINATE GLIDE DURING SETUP, DETERMINISTIC PERCENTAGE WHEN LOADED */}
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden relative">
            {isResolvingRoute ? (
              <div
                className="h-full w-2/5 bg-emerald-500 rounded-full"
                style={{
                  animation: "routeSetupSlide 1.3s cubic-bezier(0.45, 0, 0.55, 1) infinite",
                }}
              />
            ) : (
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            )}
          </div>

          {/* SYMMETRICAL ACTION DOCK: RED REPORT + BRAND DARK HUB + GREEN ACTION BUTTON */}
          <div className="flex items-center gap-3 pt-0.5">
            {/* LEFT: RED REPORT BUTTON */}
            <button
              type="button"
              onClick={() => setActiveSheet("report")}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg active:scale-95 transition-transform cursor-pointer"
              aria-label="Report Incident"
              title="Report Incident"
            >
              <AlertTriangle className="h-6 w-6 stroke-[2.2]" />
            </button>

            {/* CENTER: CO-PILOT COMMAND HUB */}
            <button
              type="button"
              onClick={() => setIsSpeedDialOpen((prev) => !prev)}
              className="relative flex h-14 flex-1 items-center justify-center gap-2.5 rounded-2xl bg-[#0a1811] text-white border border-emerald-950/80 shadow-lg active:scale-98 transition-all cursor-pointer"
              aria-label="Toggle Menu"
              title="Toggle Menu"
            >
              <Layers className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-black tracking-wider uppercase">Menu</span>
              {unreadAlertsCount > 0 && !isSpeedDialOpen && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-[#0a1811] ring-2 ring-white shadow">
                  {unreadAlertsCount}
                </span>
              )}
            </button>

            {/* RIGHT: SYMMETRICAL ACTION BUTTON (CYCLE: PLAY -> CHECK -> SPARKLE -> RESET) */}
            {routeCompleted ? (
              <button
                type="button"
                onClick={() => void loadAssignedRoute(true)}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg active:scale-95 transition-transform cursor-pointer"
                aria-label="Reset Route"
                title="Reset Route"
              >
                <RotateCcw className="h-6 w-6 stroke-[2.2]" />
              </button>
            ) : !isCollecting ? (
              <button
                type="button"
                onClick={() => {
                  setIsCollecting(true);
                  void detectGps();
                  triggerNotice("Route Started", "Live GPS collection tracking active.", "success");
                }}
                disabled={stops.length === 0 || isResolvingRoute}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg active:scale-95 transition-transform cursor-pointer disabled:opacity-40"
                aria-label="Start Collection Route"
                title="Start Route"
              >
                <Play className="h-6 w-6 fill-white" />
              </button>
            ) : allStopsDone ? (
              <button
                type="button"
                onClick={() => {
                  setIsCollecting(false);
                  setRouteCompleted(true);
                  triggerNotice("Route Finished", "All scheduled stops completed successfully.", "success");
                }}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0a1811] text-emerald-400 shadow-lg active:scale-95 transition-transform cursor-pointer"
                aria-label="Finish Route"
                title="Finish Route"
              >
                <Sparkles className="h-6 w-6" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (activeStop) markStopCompleted(activeStop.id);
                }}
                disabled={!activeStop}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg active:scale-95 transition-transform cursor-pointer disabled:opacity-40"
                aria-label="Complete Active Stop"
                title="Complete Stop"
              >
                <Check className="h-7 w-7 stroke-[3]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FLOATING MODAL 1: CHECKPOINT QUEUE */}
      {activeSheet === "checkpoints" && (
        <div
          className="fixed inset-0 z-[1020] bg-black/45 backdrop-blur-sm p-3.5 flex flex-col justify-end"
          onClick={() => setActiveSheet(null)}
        >
          <div
            className="w-full max-h-[75vh] flex flex-col rounded-3xl bg-white/95 border border-white/60 p-5 text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl origin-bottom animate-in zoom-in-90 fade-in slide-in-from-bottom-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* TACTILE GRAB PILL */}
            <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto -mt-1 mb-3 shrink-0" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black uppercase tracking-wide">
                  Checkpoint Queue
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveSheet(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2.5 py-4">
              {stops.map((stop, idx) => {
                const isCurrent = stop.status === "active";
                const isDone = stop.status === "completed";
                const formattedIndex = String(idx + 1).padStart(2, "0");

                return (
                  <div
                    key={stop.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-colors ${
                      isCurrent
                        ? "bg-[#0a1811] text-white border-emerald-500/50 shadow-md"
                        : isDone
                        ? "bg-emerald-50/50 border-emerald-100 text-slate-600"
                        : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black ${
                          isCurrent
                            ? "bg-emerald-500 text-black"
                            : isDone
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-white text-slate-500"
                        }`}
                      >
                        {formattedIndex}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold leading-tight">
                          {stop.name}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {isDone ? `Collected ${stop.completedAt}` : stop.address}
                        </p>
                      </div>
                    </div>

                    {isCurrent && isCollecting && (
                      <button
                        type="button"
                        onClick={() => markStopCompleted(stop.id)}
                        className="px-2.5 py-1 rounded-xl bg-emerald-500 text-black text-[10px] font-black uppercase cursor-pointer"
                      >
                        Done
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING MODAL 2: ALERTS AND DISPATCHES */}
      {activeSheet === "alerts" && (
        <div
          className="fixed inset-0 z-[1020] bg-black/45 backdrop-blur-sm p-3.5 flex flex-col justify-end"
          onClick={() => {
            setAlertsList((prev) => prev.map((a) => ({ ...a, read: true })));
            setActiveSheet(null);
          }}
        >
          <div
            className="w-full max-h-[75vh] flex flex-col rounded-3xl bg-white/95 border border-white/60 p-5 text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl origin-bottom animate-in zoom-in-90 fade-in slide-in-from-bottom-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* TACTILE GRAB PILL */}
            <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto -mt-1 mb-3 shrink-0" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black uppercase tracking-wide">
                  Live Dispatch Feed
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAlertsList((prev) =>
                    prev.map((a) => ({ ...a, read: true })),
                  );
                  setActiveSheet(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 py-4">
              {alertsList.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      {alert.priority} Priority
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {alert.time}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">
                    {alert.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING MODAL 3: ROUTE AND CARGO METRICS */}
      {activeSheet === "metrics" && (
        <div
          className="fixed inset-0 z-[1020] bg-black/45 backdrop-blur-sm p-3.5 flex flex-col justify-end"
          onClick={() => setActiveSheet(null)}
        >
          <div
            className="w-full rounded-3xl bg-white/95 border border-white/60 p-5 text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl origin-bottom animate-in zoom-in-90 fade-in slide-in-from-bottom-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* TACTILE GRAB PILL */}
            <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto -mt-1 mb-3 shrink-0" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-black uppercase tracking-wide">
                  Route Telemetry
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveSheet(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 py-4">
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Total Distance
                </span>
                <p className="text-lg font-black text-slate-900 mt-1">
                  {totalDistanceKm} km
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Stops Finished
                </span>
                <p className="text-lg font-black text-slate-900 mt-1">
                  {completedStopsCount} / {stops.length}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Completion
                </span>
                <p className="text-lg font-black text-emerald-600 mt-1">
                  {progressPercent}%
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Assigned Cargo
                </span>
                <p className="text-lg font-black text-slate-900 mt-1">
                  {assignedRoute?.wasteType ?? "Regular"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING MODAL 4: INCIDENT REPORT WITH PHOTO PREVIEW */}
      {activeSheet === "report" && (
        <div
          className="fixed inset-0 z-[1020] bg-black/50 backdrop-blur-sm p-3.5 flex flex-col justify-end"
          onClick={() => {
            handleClearPhoto();
            setActiveSheet(null);
          }}
        >
          <form
            onSubmit={handleReportSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-3xl bg-white/95 border border-white/60 p-5 text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl origin-bottom-left animate-in zoom-in-90 fade-in slide-in-from-bottom-4 duration-200 space-y-4"
          >
            {/* TACTILE GRAB PILL */}
            <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto -mt-1 mb-2 shrink-0" />

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
                  setActiveSheet(null);
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