"use client";

import { Loader2, LocateFixed } from "lucide-react";
import { DashboardCard } from "@bazoora/ui";
import SmartMap from "@/components/map/smart-map";
import { useTruckTracking } from "@/features/trucks/hooks";
import { useLatestNotificationPolling } from "@/features/notifications/hooks";
import { useAuthStore } from "@/stores/auth-store";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { LocationPermissionModal } from "@/components/ui/location-permission";
import { env } from "@/lib/env";
import type { MapMarker, MapRoute } from "@/components/map/smart-map";
import type { Notification } from "@/features/notifications/schemas";
import { calculateMatrix } from "@/lib/routing";

export default function TrackTruckPage(): React.ReactNode {
  const user = useAuthStore((s) => s.user);
  const { trucks } = useTruckTracking();

  const [gpsPos, setGpsPos] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [completedPickup, setCompletedPickup] = useState<Notification | null>(null);
  const [selectedStopForPhoto, setSelectedStopForPhoto] = useState<any | null>(null);

  const [truckEta, setTruckEta] = useState<string | null>(null);
  const lastCalculatedPosRef = useRef<{ lat: number; lng: number } | null>(null);

  const activeTruck =
    trucks.find((t) => t.status === "active") ||
    trucks.find((t) => t.plannedRoute && t.plannedRoute.length > 0) ||
    trucks[0];

  // Calculate truck ETA dynamically using Matrix API
  useEffect(() => {
    if (!gpsPos || !activeTruck?.currentLocation) {
      setTruckEta(null);
      return;
    }

    const truckLoc = activeTruck.currentLocation;
    const prevLoc = lastCalculatedPosRef.current;

    // Throttle: only query if the truck moved significantly (>40 meters)
    if (prevLoc) {
      const dx = truckLoc.lat - prevLoc.lat;
      const dy = truckLoc.lng - prevLoc.lng;
      if (Math.hypot(dx, dy) < 0.0004) {
        return;
      }
    }

    lastCalculatedPosRef.current = { lat: truckLoc.lat, lng: truckLoc.lng };

    calculateMatrix(
      [
        [truckLoc.lng, truckLoc.lat], // Source (Truck)
        [gpsPos[1], gpsPos[0]], // Destination (Resident)
      ],
      { profile: "driving" },
    )
      .then((matrix) => {
        const duration = matrix.durations?.[0]?.[0];
        if (duration !== undefined && duration !== null) {
          const minutes = Math.ceil(duration / 60);
          if (minutes <= 1) {
            setTruckEta("Nearby (< 1 min)");
          } else {
            setTruckEta(`${minutes} mins`);
          }
        } else {
          setTruckEta(null);
        }
      })
      .catch((error) => {
        console.error("Failed to calculate truck matrix ETA", error);
        setTruckEta(null);
      });
  }, [gpsPos, activeTruck?.currentLocation?.lat, activeTruck?.currentLocation?.lng]);

  /* ── Poll for latest pickup notification ──────────────────────── */
  const lastSeenIdRef = useRef<string | null>(null);
  const { data: latestNotification } = useLatestNotificationPolling(user?.id);

  useEffect(() => {
    if (
      latestNotification &&
      latestNotification.id !== lastSeenIdRef.current &&
      latestNotification.status === "picked_up"
    ) {
      lastSeenIdRef.current = latestNotification.id;
      setCompletedPickup(latestNotification);

      const driverLabel =
        latestNotification.driverType === "government" ? "Municipal Truck" : "EcoAide";

      toast.success(
        `Your waste has been collected by ${driverLabel} — ${new Date(latestNotification.createdAt).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}`,
        {
          duration: 6000,
          description: latestNotification.message,
          icon: "🗑️",
        },
      );

      setTimeout(() => {
        setCompletedPickup(null);
      }, 8000);
    }
  }, [latestNotification]);

  /* ── GPS ──────────────────────────────────────────────────────── */
  const detectGps = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsPos([pos.coords.latitude, pos.coords.longitude]);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setGpsPos([13.8248, 121.3964]);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  /* ── Dynamic Route from Tracker ───────────────────────────────── */
  const plannedStops = activeTruck?.plannedRoute || [];

  /* ── Compute dynamic stop statuses ────────────────────────────── */
  let currentStopIndex = -1;
  if (activeTruck?.currentLocation && plannedStops.length > 0) {
    let minDist = Infinity;
    plannedStops.forEach((stop: any, i: number) => {
      const dx = stop.lat - activeTruck.currentLocation!.lat;
      const dy = stop.lng - activeTruck.currentLocation!.lng;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.001 && dist < minDist) {
        minDist = dist;
        currentStopIndex = i;
      }
    });
  }

  const dynamicStops = plannedStops.map((stop: any, i: number) => {
    const isCompleted = stop.status === "completed" || !!stop.proofPhotoUrl;
    return {
      ...stop,
      status: isCompleted
        ? "done"
        : currentStopIndex === -1
          ? "upcoming"
          : i < currentStopIndex
            ? "done"
            : i === currentStopIndex
              ? "now"
              : "upcoming",
    };
  });

  /* ── Map data ──────────────────────────────────────────────────── */
  const mapCenter: [number, number] = gpsPos ?? [13.8248, 121.3964];

  const truckMarkers: MapMarker[] = trucks
    .filter(
      (t) =>
        t.currentLocation &&
        (t.status === "active" || (t.plannedRoute && t.plannedRoute.length > 0)),
    )
    .map((t) => ({
      id: t.id,
      position: [t.currentLocation!.lat, t.currentLocation!.lng] as [number, number],
      label: t.plateNumber,
      icon: t.plateNumber.includes("ECO") ? "eco" : "truck",
      pulse: true,
    }));

  const homeMarker: MapMarker[] = gpsPos
    ? [{ id: "home", position: gpsPos, label: "Your Location", icon: "home" as const }]
    : [];

  const completedMarkers: MapMarker[] = completedPickup
    ? [
        {
          id: "done",
          position: [completedPickup.pickupLocation.lat, completedPickup.pickupLocation.lng],
          label: "Collected ✓",
          icon: "done" as const,
        },
      ]
    : [];

  const stopMarkers: MapMarker[] = plannedStops.map((stop: any, idx: number) => {
    const isCompleted = stop.status === "completed" || !!stop.proofPhotoUrl;
    return {
      id: `stop-${stop.id || idx}`,
      position: [stop.lat, stop.lng] as [number, number],
      icon: isCompleted ? ("done" as const) : ("pending" as const),
      popupContent: (
        <div className="min-w-[200px] p-1 font-sans text-gray-900">
          <h4 className="mb-1 text-xs leading-snug font-extrabold">{stop.name}</h4>
          {isCompleted ? (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                <span className="h-1 w-1 rounded-full bg-emerald-500" />
                Collected ✓
              </span>
              {stop.proofPhotoUrl && (
                <div className="mt-2 flex flex-col gap-2">
                  <div
                    className="relative h-20 w-full cursor-zoom-in overflow-hidden rounded-lg border border-gray-200 bg-gray-50 transition-all hover:opacity-90 active:scale-95"
                    onClick={() => {
                      setSelectedStopForPhoto(stop);
                    }}
                  >
                    <img
                      src={`${env.NEXT_PUBLIC_SOCKET_URL}${stop.proofPhotoUrl}`}
                      alt="Proof of Collection"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStopForPhoto(stop);
                    }}
                    className="w-full rounded-md bg-emerald-50 py-1.5 text-center text-[9px] font-extrabold tracking-widest text-emerald-600 uppercase transition hover:bg-emerald-100 active:scale-95"
                  >
                    View Full Photo
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[9px] font-bold text-orange-700">
                <span className="h-1 w-1 animate-pulse rounded-full bg-orange-500" />
                Upcoming Stop
              </span>
            </div>
          )}
        </div>
      ),
    };
  });

  const mapMarkers: MapMarker[] = [
    ...truckMarkers,
    ...homeMarker,
    ...completedMarkers,
    ...stopMarkers,
  ];

  const activeRouteWaypoints = plannedStops
    .filter((s: any) => s.status !== "completed")
    .map((s: any) => [s.lng, s.lat] as [number, number]);

  const mapRoutes: MapRoute[] =
    activeRouteWaypoints.length > 0
      ? [
          {
            waypoints: activeTruck?.currentLocation
              ? ([
                  [activeTruck.currentLocation.lng, activeTruck.currentLocation.lat],
                  ...activeRouteWaypoints,
                ] as [number, number][])
              : activeRouteWaypoints,
            color: activeTruck?.plateNumber.includes("ECO") ? "green" : "blue",
            label: activeTruck?.plateNumber.includes("ECO") ? "Eco-Aide" : "Collection Truck",
            eta: truckEta ?? undefined,
          },
        ]
      : [];

  return (
    <div className="dark:bg-background flex h-[calc(100vh-4rem)] flex-col gap-4 overflow-hidden bg-[#F5F5F5] p-4 lg:flex-row lg:p-6">
      <LocationPermissionModal onAllow={detectGps} />
      {/* Map Area */}
      <div className="relative order-1 flex min-h-[380px] flex-1 flex-col gap-4 lg:order-1">
        <div className="relative flex-1 overflow-hidden rounded-2xl shadow-lg">
          <SmartMap
            center={mapCenter}
            zoom={16}
            markers={mapMarkers}
            routes={mapRoutes}
            className="h-full w-full"
          />

          <button
            type="button"
            onClick={detectGps}
            className="absolute top-4 left-4 z-[1000] flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs font-bold text-gray-700 shadow-md transition-all hover:bg-gray-50 active:scale-95"
          >
            {isLocating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
            ) : (
              <LocateFixed className="h-3.5 w-3.5 text-emerald-500" />
            )}
            {isLocating ? "Locating…" : "My Location"}
          </button>
        </div>

        <div className="hidden grid-cols-2 gap-4 lg:grid">
          <DashboardCard className="rounded-xl bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
            <div className="p-5">
              <p className="mb-2 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                ROUTE OVERVIEW
              </p>
              <p className="text-base font-bold text-gray-900 dark:text-white">
                Active Route · {plannedStops.length} stops
              </p>
            </div>
          </DashboardCard>
          <DashboardCard className="rounded-xl bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
            <div className="p-5">
              <p className="mb-2 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                TRACKER STATUS
              </p>
              <p className="flex items-center justify-between text-base font-bold text-gray-900 dark:text-white">
                <span>{activeTruck ? activeTruck.plateNumber : "Searching…"}</span>
                {truckEta && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-black text-emerald-700">
                    {truckEta} away
                  </span>
                )}
              </p>
            </div>
          </DashboardCard>
        </div>
      </div>

      {/* Side Panel */}
      <div className="order-2 flex h-full w-full flex-col gap-4 lg:order-2 lg:w-[400px] lg:overflow-hidden">
        <DashboardCard className="flex-1 overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
          <div className="p-5">
            <h4 className="mb-4 text-sm font-black text-gray-900 dark:text-white">Route Stops</h4>
            <div className="space-y-4">
              {dynamicStops.length === 0 && (
                <p className="text-xs text-gray-400">No active route planned.</p>
              )}
              {dynamicStops.map((stop: any, index: number) => (
                <div key={stop.id} className="relative flex gap-4">
                  <div className="mt-2 flex flex-col items-center">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${stop.status === "now" || stop.status === "done" ? "bg-[#0f2419] text-white" : "bg-gray-200 text-gray-500"}`}
                    >
                      {stop.status === "done" ? "✓" : index + 1}
                    </div>
                  </div>
                  <div
                    className={`flex-1 rounded-xl border p-4 transition-all ${stop.status === "now" ? "border-[#0f2419] bg-[#0f2419] text-white shadow-lg" : "dark:bg-background border-gray-100 bg-white dark:border-gray-700"}`}
                  >
                    <p className="text-sm font-bold">{stop.name}</p>

                    {stop.proofPhotoUrl && (
                      <div className="mt-3 flex items-center gap-3 border-t border-dashed border-gray-100 pt-3">
                        <div
                          className="relative h-12 w-12 cursor-zoom-in overflow-hidden rounded-lg border border-gray-200 bg-gray-50 transition-all hover:opacity-90 active:scale-95"
                          onClick={() => {
                            setSelectedStopForPhoto(stop);
                          }}
                        >
                          <img
                            src={`${env.NEXT_PUBLIC_SOCKET_URL}${stop.proofPhotoUrl}`}
                            alt="Proof of Collection"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-extrabold tracking-widest text-emerald-500 uppercase">
                            Collected ✓
                          </p>
                          <p
                            className={`truncate text-[11px] font-semibold ${stop.status === "now" ? "text-white/80" : "text-gray-400"}`}
                          >
                            {stop.completedAt
                              ? new Date(stop.completedAt).toLocaleTimeString("en-PH", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Recently picked up"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Proof Photo Fullscreen Modal Overlay */}
      {selectedStopForPhoto && (
        <div
          className="animate-in fade-in fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black/85 p-4 backdrop-blur-md duration-200"
          onClick={() => {
            setSelectedStopForPhoto(null);
          }}
        >
          <div
            className="animate-in zoom-in-95 relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl duration-200"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {/* Close button */}
            <button
              onClick={() => {
                setSelectedStopForPhoto(null);
              }}
              className="absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70 active:scale-95"
            >
              ✕
            </button>

            {/* Photo Container */}
            <div className="relative flex min-h-[300px] flex-1 items-center justify-center overflow-hidden bg-gray-900 md:min-h-[400px]">
              <img
                src={`${env.NEXT_PUBLIC_SOCKET_URL}${selectedStopForPhoto.proofPhotoUrl}`}
                alt="Proof of Collection"
                className="max-h-[70vh] max-w-full object-contain"
              />
            </div>

            {/* Stop Details */}
            <div className="dark:bg-card p-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Collection Completed
              </span>
              <h3 className="mt-3 text-lg font-black text-gray-900 dark:text-white">
                {selectedStopForPhoto.name}
              </h3>
              <p className="mt-1 text-xs font-semibold text-gray-500">
                Collected at:{" "}
                {selectedStopForPhoto.completedAt
                  ? new Date(selectedStopForPhoto.completedAt).toLocaleString("en-PH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
