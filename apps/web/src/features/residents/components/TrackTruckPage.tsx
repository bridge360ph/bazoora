"use client";

import { Loader2, LocateFixed } from "lucide-react";
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
        <div className="min-w-50 p-1 font-sans text-gray-900">
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

  /* ── Neighborhood Proximity Check ─────────────────────────────── */
  const distanceFromTruckMeters =
    gpsPos && activeTruck?.currentLocation
      ? (() => {
          const R = 6_371_000;
          const dLat = ((gpsPos[0] - activeTruck.currentLocation.lat) * Math.PI) / 180;
          const dLng = ((gpsPos[1] - activeTruck.currentLocation.lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((activeTruck.currentLocation.lat * Math.PI) / 180) *
              Math.cos((gpsPos[0] * Math.PI) / 180) *
              Math.sin(dLng / 2) ** 2;
          return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
        })()
      : null;

  const isTruckInNeighborhood =
    distanceFromTruckMeters !== null && distanceFromTruckMeters <= 250;

  /* ── Values shown in the cards (real data only, never placeholders) ── */
  const totalStops = dynamicStops.length;
  const collectedStops = dynamicStops.filter((s: any) => s.status === "done").length;
  const nextStop =
    dynamicStops.find((s: any) => s.status === "now") ??
    dynamicStops.find((s: any) => s.status === "upcoming");

  const distanceFromTruckLabel =
    distanceFromTruckMeters === null
      ? null
      : distanceFromTruckMeters < 1000
        ? `${distanceFromTruckMeters} m`
        : `${(distanceFromTruckMeters / 1000).toFixed(1)} km`;

  const formatStopTime = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? null
      : date.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
  };

return (
  <div className="flex h-full min-h-0 overflow-hidden bg-surface p-5 box-border">
    <LocationPermissionModal onAllow={detectGps} />

    {/* Main content */}
    <div className="flex min-h-0 min-w-0 flex-1 gap-5">
      {/* LEFT / MAP SECTION */}
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        {/* Map */}
        <section className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-[#dfe2e8]">
          <div className="absolute left-3 top-3 z-1000 rounded-md bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm">
            Map View
          </div>

          <SmartMap
            center={mapCenter}
            zoom={16}
            markers={mapMarkers}
            routes={mapRoutes}
            className="h-full w-full"
          />

          {/* Map controls */}
          <div className="absolute right-3 top-3 z-1000 flex flex-col gap-2">
            <button
              type="button"
              onClick={detectGps}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-gray-700 shadow-md transition hover:bg-gray-50"
              aria-label="Locate me"
            >
              {isLocating ? (
                <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              ) : (
                <LocateFixed className="h-5 w-5" />
              )}
            </button>

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-gray-700 shadow-md"
              aria-label="Map layers"
            >
              <span className="text-lg">⌬</span>
            </button>
          </div>

          {/* Nearby notification */}
          {isTruckInNeighborhood && (
            <div className="absolute left-1/2 top-4 z-1000 -translate-x-1/2">
              <div className="flex items-center gap-3 rounded-lg bg-brand-dark/95 px-4 py-2.5 shadow-xl">
                <span className="relative flex h-3 w-3">
                  <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative h-3 w-3 rounded-full bg-emerald-500" />
                </span>

                <span className="text-xs font-semibold text-white">
                  Collection Truck Nearby ({distanceFromTruckMeters}m away)
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Bottom information cards */}
        <div className="grid h-77.5 grid-cols-2 gap-5">
          {/* Route Overview */}
          <section className="rounded-xl border border-solid border-gray-300! bg-white p-6">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-gray-400">
              ROUTE OVERVIEW
            </p>

            <h2 className="mt-3 text-xl font-bold text-gray-800">
              {activeTruck
                ? totalStops > 0
                  ? `Active Route · ${totalStops} ${totalStops === 1 ? "stop" : "stops"}`
                  : "Truck on the road"
                : "No active route"}
            </h2>

            <p className="mt-3 text-xs text-gray-500">
              {activeTruck
                ? totalStops > 0
                  ? `${collectedStops} of ${totalStops} stops collected`
                  : "No stops have been planned for this route yet."
                : "The collection truck will appear here once it starts its route."}
            </p>

            {activeTruck && (
              <p className="mt-4 text-[10px] text-gray-400">
                {distanceFromTruckLabel
                  ? `Truck is ${distanceFromTruckLabel} from you`
                  : "Allow location access to see how far the truck is."}
              </p>
            )}
          </section>

          {/* Next stop */}
          <section className="rounded-xl border border-solid border-gray-300! bg-white p-6">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-gray-400">
              NEXT STOP
            </p>

            <div className="mt-4 flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-border text-brand-secondary">
                ▣
              </div>

              <div className="min-w-0">
                <h2 className="text-base font-bold text-gray-800">
                  {nextStop?.name ?? (totalStops > 0 ? "All stops collected" : "No upcoming stops")}
                </h2>

                {nextStop && (
                  <p className="mt-1 text-xs text-gray-500">
                    Stop {dynamicStops.indexOf(nextStop) + 1} of {totalStops}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-[9px] font-medium tracking-wider text-gray-400">
                TRUCK ETA TO YOU
              </span>

              <span className="text-sm font-bold text-gray-800">
                {truckEta ?? "Not available"}
              </span>
            </div>
          </section>
        </div>
      </div>

      {/* RIGHT PANEL */}
       <div className="flex min-h-0 w-full lg:w-77.5 lg:shrink-0 flex-col gap-5">
        {/* Truck Information */}
        <section className="rounded-xl border border-gray-300 bg-white p-6">
          <p className="text-[10px] font-semibold tracking-[0.15em] text-gray-400">
            TRUCK INFORMATION
          </p>

          {activeTruck ? (
            <>
              <h2 className="mt-3 text-base font-bold text-gray-800">
                {activeTruck.plateNumber}
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {activeTruck.status === "active" ? "On route" : "Idle"}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                {truckEta
                  ? `ETA: ${truckEta} away`
                  : "ETA not available yet"}
              </p>
            </>
          ) : (
            <p className="mt-3 text-xs text-gray-500">
              No collection truck is on the road right now.
            </p>
          )}
        </section>

        {/* Route Path */}
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-solid border-gray-300! bg-white">
          <div className="px-5 pb-3 pt-6 text-center">
            <h2 className="text-base font-bold text-gray-800">
              Route Path
            </h2>

            {totalStops > 0 && (
              <p className="mt-3 text-xs text-gray-400">
                {collectedStops} of {totalStops} collected
              </p>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
            <div className="relative space-y-3">
              {dynamicStops.length === 0 ? (
                <p className="py-8 text-center text-xs text-gray-400">
                  No active route planned.
                </p>
              ) : (
                dynamicStops.map((stop: any, index: number) => (
                  <div
                    key={stop.id ?? index}
                    className="relative flex gap-3"
                  >
                    {/* Timeline */}
                    <div className="relative flex w-7 shrink-0 justify-center">
                      {index !== dynamicStops.length - 1 && (
                        <div className="absolute top-7 h-full w-0.5 bg-gray-200" />
                      )}

                      <div
                        className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-bold ${
                          stop.status === "now"
                            ? "bg-brand-dark text-white"
                            : stop.status === "done"
                              ? "bg-surface-border text-brand-secondary"
                              : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {stop.status === "done" ? "✓" : index + 1}
                      </div>
                    </div>

                    {/* Stop card */}
                    <div
                      className={`min-w-0 flex-1 rounded-lg border p-4 ${
                        stop.status === "now"
                          ? "border-brand-dark bg-brand-dark text-white shadow-md"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-xs font-bold ${
                            stop.status === "now"
                              ? "text-white"
                              : "text-gray-800"
                          }`}
                        >
                          {stop.name}
                        </p>

                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-[8px] font-bold ${
                            stop.status === "done"
                              ? "bg-surface-border text-brand-secondary"
                              : stop.status === "now"
                                ? "bg-white text-brand-dark"
                                : "bg-[#e5eee9] text-[#4d6a5b]"
                          }`}
                        >
                          {stop.status === "done"
                            ? formatStopTime(stop.completedAt)
                              ? `DONE · ${formatStopTime(stop.completedAt)}`
                              : "DONE"
                            : stop.status === "now"
                              ? "NOW"
                              : "UPCOMING"}
                        </span>
                      </div>

                      {(stop.households || stop.areaType) && (
                        <p
                          className={`mt-2 text-[10px] ${
                            stop.status === "now"
                              ? "text-white/70"
                              : "text-gray-400"
                          }`}
                        >
                          {[
                            stop.households ? `${stop.households} households` : null,
                            stop.areaType,
                          ]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>

    {/* Proof Photo Modal */}
    {selectedStopForPhoto && (
      <div
        className="fixed inset-0 z-10000 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
        onClick={() => setSelectedStopForPhoto(null)}
      >
        <div
          className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setSelectedStopForPhoto(null)}
            className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white"
          >
            ✕
          </button>

          <div className="flex min-h-75 items-center justify-center overflow-hidden bg-gray-900">
            <img
              src={`${env.NEXT_PUBLIC_SOCKET_URL}${selectedStopForPhoto.proofPhotoUrl}`}
              alt="Proof of Collection"
              className="max-h-[70vh] max-w-full object-contain"
            />
          </div>

          <div className="p-6">
            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              Collection Completed
            </span>

            <h3 className="mt-3 text-lg font-bold text-gray-900">
              {selectedStopForPhoto.name}
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Collected at:{" "}
              {selectedStopForPhoto.completedAt
                ? new Date(
                    selectedStopForPhoto.completedAt,
                  ).toLocaleString("en-PH", {
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