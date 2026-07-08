"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SmartMap from "@/components/map/smart-map";
import { Navigation, Leaf, Camera, Image as ImageIcon, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { geocode, reverseGeocode } from "@/lib/geocoding";
import { toast } from "sonner";
import { useHaulingRequests, useUpdateHaulingRequest } from "@/features/hauling-requests/hooks";
import { LocationPermissionModal } from "@/components/ui/location-permission";
import { env } from "@/lib/env";
import type { MapMarker, MapRoute } from "@/components/map/smart-map";
import { compressImage } from "@/lib/image-compress";

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function EcoAideRoute(): React.ReactNode {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { data: haulingRequests } = useHaulingRequests();
  const updateHauling = useUpdateHaulingRequest();

  // State
  const [stops, setStops] = useState<any[]>([]);
  const [isPlanning, setIsPlanning] = useState(true);
  const [isCollecting, setIsCollecting] = useState(false);
  const [gpsPos, setGpsPos] = useState<[number, number] | null>(null);
  const [gpsAddress, setGpsAddress] = useState("Detecting location...");
  const [showConfirm, setShowConfirm] = useState(false);
  const [trackerId, setTrackerId] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const watchIdRef = useRef<number | null>(null);

  // Tabs and Decline state
  const [activeTab, setActiveTab] = useState<"route" | "invites">("route");
  const [declineRequest, setDeclineRequest] = useState<any | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  /* ── Fetch Assigned Tracker ────────────────────────────────────── */
  useEffect(() => {
    if (!accessToken || accessToken === "null") return;

    async function getMyTracker() {
      try {
        const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/trucks/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const json = await res.json();
        if (json.success && json.data) {
          const tracker = json.data;
          setTrackerId(tracker.id);

          // Restore saved route if it exists
          if (tracker.plannedRoute && tracker.plannedRoute.length > 0) {
            setStops(tracker.plannedRoute);

            // If already on route, restore UI state
            if (tracker.status === "active") {
              setIsPlanning(false);
              setIsCollecting(true);

              // Restore GPS position if available
              if (tracker.currentLocation) {
                setGpsPos([tracker.currentLocation.lat, tracker.currentLocation.lng]);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch assigned tracker", error);
      }
    }
    getMyTracker();
  }, [accessToken]);

  /* ── Derived State ────────────────── */
  const activeStop = stops.find((s) => s.status === "active");
  const allStopsDone = stops.length > 0 && stops.every((s) => s.status === "completed");
  const distanceToActive =
    gpsPos && activeStop
      ? haversineMeters(gpsPos[0], gpsPos[1], activeStop.lat, activeStop.lng)
      : Infinity;
  const isNearby = distanceToActive < 150;

  /* ── Real GPS Tracking Mode ────────────────────────────────────── */
  useEffect(() => {
    if (!isCollecting || !trackerId) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Geolocation not supported", {
        description: "Your device does not support GPS tracking.",
      });
      return;
    }

    toast.info("Real GPS Tracking Active", {
      description: "Streaming live device coordinates to the map.",
    });

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude: lat, longitude: lng, heading, speed } = position.coords;
        setGpsPos([lat, lng]);

        // Post real location to backend
        try {
          await fetch(`${env.NEXT_PUBLIC_API_URL}/trucks/${trackerId}/location`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              lat,
              lng,
              heading: heading ?? 0,
              speed: speed ?? 0,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (error) {
          console.error("Failed to post real GPS location", error);
        }

        // Auto reverse geocode for status display
        try {
          const result = await reverseGeocode(lat, lng);
          setGpsAddress(result.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } catch {
          setGpsAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      },
      (error) => {
        console.warn("GPS Watch error", error);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("GPS Tracking Error", {
            description: "Location access denied. Please enable it in your browser settings.",
          });
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30_000,
        timeout: 30_000,
      },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isCollecting, trackerId, accessToken]);

  /* ── Load Resident Requests into Route ────────────────────────── */
  useEffect(() => {
    // Only load if we are in planning mode
    if (haulingRequests && isPlanning) {
      const approved = haulingRequests.filter((r) => r.status === "approved");

      const loadStops = async () => {
        const mappedStops = [];
        for (const req of approved) {
          // Use stored coordinates if available
          if (req.lat && req.lng) {
            mappedStops.push({
              id: req.id,
              name: req.pickupAddress.split(",")[0],
              lat: req.lat,
              lng: req.lng,
              status: "pending" as const,
              price: req.price,
              paymentMethod: req.paymentMethod,
              paymentStatus: req.paymentStatus,
              wasteType: req.wasteType,
              volume: req.volume,
            });
            continue;
          }

          try {
            const results = await geocode(req.pickupAddress, { limit: 1 });
            const first = results?.[0];
            if (first) {
              mappedStops.push({
                id: req.id,
                name: req.pickupAddress.split(",")[0],
                lat: Number(first.lat),
                lng: Number(first.lon),
                status: "pending" as const,
                price: req.price,
                paymentMethod: req.paymentMethod,
                paymentStatus: req.paymentStatus,
                wasteType: req.wasteType,
                volume: req.volume,
              });
            }
          } catch (error) {
            console.error("Geocoding failed for request", req.id, error);
          }
        }

        setStops(mappedStops);
      };

      loadStops();
    }
  }, [haulingRequests, isPlanning]);

  /* ── Initial Location ──────────────────────────────────────────── */
  const detectGps = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setGpsPos([lat, lng]);
        try {
          const result = await reverseGeocode(lat, lng);
          setGpsAddress(result.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } catch {
          setGpsAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      },
      (error) => {
        console.warn("Initial GPS error", error);
      },
      { enableHighAccuracy: true },
    );
  }, []);

  /* ── Route Planning ────────────────────────────────────────────── */
  const handleMapClick = async (_pos: [number, number]) => {
    // Disabled: Eco-Aide cannot create own route
    toast.info("Manual stops disabled", {
      description: "Your route is based on resident hauling requests.",
    });
  };

  const [isStarting, setIsStarting] = useState(false);

  const optimizeRoute = () => {
    if (stops.length < 2 || !stops[0]) {
      toast.info("No need to optimize", {
        description: "Add at least 2 stops to optimize the route.",
      });
      return;
    }

    const startingPos: [number, number] = gpsPos ?? [stops[0].lat, stops[0].lng];
    const unvisited = [...stops];
    const optimized: any[] = [];
    let currentPos = startingPos;

    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (const [i, stop] of unvisited.entries()) {
        if (!stop) continue;
        const dist = haversineMeters(currentPos[0], currentPos[1], stop.lat, stop.lng);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }

      const nextStop = unvisited.splice(nearestIdx, 1)[0];
      if (nextStop) {
        optimized.push(nextStop);
        currentPos = [nextStop.lat, nextStop.lng];
      }
    }

    setStops(optimized);
    toast.success("Route Optimized", {
      description: "Stops rearranged using nearest-neighbor algorithm.",
    });
  };

  const startCollection = async () => {
    if (stops.length === 0) return;

    if (!trackerId) {
      toast.error("No Tracker Connected", { description: "Please wait for server connection." });
      return;
    }

    setIsStarting(true);

    // 1. Sync route with tracker so residents see it
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/trucks/${trackerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
        body: JSON.stringify({
          plannedRoute: stops,
          status: "active",
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      setIsPlanning(false);
      setIsCollecting(true);
      setStops((prev) => prev.map((s, i) => (i === 0 ? { ...s, status: "active" } : s)));
    } catch (error: any) {
      console.error("Failed to sync eco-route", error);
      toast.error("Sync Failed", { description: error.message || "Route could not be saved." });
    } finally {
      setIsStarting(false);
    }
  };

  /* ── Collection Lifecycle ───────────────────────────────────────── */

  const finishCollection = async () => {
    if (!trackerId) return;
    setIsStarting(true);
    try {
      await fetch(`${env.NEXT_PUBLIC_API_URL}/trucks/${trackerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ plannedRoute: [], status: "idle" }),
      });
      setIsPlanning(true);
      setIsCollecting(false);
      setStops([]);
      toast.success("Collection Completed", { description: "You have finalized this eco-route." });
    } catch (error: any) {
      toast.error("Finish Failed", { description: error.message });
    } finally {
      setIsStarting(false);
    }
  };

  /* ── Map state ────────────────────────────────────────────────── */
  const mapCenter: [number, number] = gpsPos ?? [13.8248, 121.3964];

  const mapMarkers: MapMarker[] = [
    ...(gpsPos
      ? [
          {
            id: "eco",
            position: gpsPos,
            label: isCollecting ? "Eco-Aide" : "Current Location",
            icon: isCollecting ? ("eco" as const) : ("home" as const),
            pulse: isCollecting,
          },
        ]
      : []),
    ...stops.map((stop) => ({
      id: stop.id,
      position: [stop.lat, stop.lng] as [number, number],
      label: stop.name,
      icon: (stop.status === "completed" ? "done" : "pending") as any,
      pulse: stop.status === "active",
    })),
    ...(haulingRequests
      ?.filter((req) => req.status === "pending")
      .map((req) => ({
        id: `pending-${req.id}`,
        position: [req.lat ?? 13.8241, req.lng ?? 121.4019] as [number, number],
        label: `Pending: ${req.pickupAddress.split(",")[0]}`,
        icon: "pending" as const,
        pulse: false,
      })) || []),
  ];

  const activeStops = stops.filter((s) => s.status !== "completed");
  const mapRoutes: MapRoute[] =
    activeStops.length > 0
      ? [
          {
            waypoints: [
              ...(gpsPos ? [[gpsPos[1], gpsPos[0]] as [number, number]] : []),
              ...activeStops.map((s) => [s.lng, s.lat] as [number, number]),
            ],
            color: "green",
            label: "Eco-Aide Route",
          },
        ]
      : [];

  /* ── Mark Picked Up ────────────────────────────────────────────── */
  const confirmPickup = async () => {
    if (!activeStop || !user) return;
    setIsUploading(true);
    let uploadedUrl: string | null = null;

    try {
      if (photoFile) {
        const { base64, mimeType } = await compressImage(photoFile);

        const uploadRes = await fetch(`${env.NEXT_PUBLIC_API_URL}/uploads/image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ base64, mimeType }),
        });

        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          uploadedUrl = uploadData.data.url;
        } else {
          throw new Error("Failed to upload image");
        }
      }

      // 1. Mark as completed in the database first
      const completedTime = new Date().toLocaleTimeString();
      const driverName = user?.firstName ? `${user.firstName} ${user.lastName}` : "Eco-Aide";

      updateHauling.mutate(
        {
          id: activeStop.id,
          input: { status: "completed", proofPhotoUrl: uploadedUrl },
        },
        {
          onSuccess: () => {
            // 2. We skip the notification mutation as requested.

            // 3. Update local UI state
            setStops((prev) => {
              const next = [...prev];
              const idx = next.findIndex((s) => s.id === activeStop.id);
              if (idx !== -1) {
                next[idx] = {
                  ...next[idx],
                  status: "completed",
                  proofPhotoUrl: uploadedUrl ?? undefined,
                  completedBy: driverName,
                  time: completedTime,
                  completedAt: completedTime,
                };
                if (idx + 1 < next.length) {
                  next[idx + 1] = { ...next[idx + 1], status: "active" };
                }
              }

              // Synchronize tracker plannedRoute in DB so residents see progress live!
              fetch(`${env.NEXT_PUBLIC_API_URL}/trucks/${trackerId}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
                },
                body: JSON.stringify({ plannedRoute: next }),
              }).catch((error) => {
                console.error("Failed to sync tracker plannedRoute:", error);
              });

              return next;
            });
            setShowConfirm(false);
            setPhotoFile(null);
            setPhotoPreview(null);
            toast.success("Stop Completed", { description: "Database updated." });
          },
          onError: (err: any) => {
            console.error("Status update failed", err);
            toast.error("Database Update Failed", {
              description: "The request could not be marked as completed.",
            });
          },
        },
      );
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Upload Failed", { description: "Could not upload photo." });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-white lg:flex-row">
      <LocationPermissionModal onAllow={detectGps} />
      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="mx-4 w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
              <Leaf className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="mb-2 text-xl font-black text-gray-900">Waste Collected?</h3>
            <p className="mb-6 text-sm text-gray-500">
              Confirm you have collected waste from <b>{activeStop?.name}</b>.
            </p>
            {activeStop?.paymentMethod === "cash" && (
              <div className="mb-6 rounded-2xl border border-amber-100 bg-amber-50/50 p-4 text-left">
                <h4 className="mb-1 text-xs font-black tracking-wider text-amber-800 uppercase">
                  💰 Collect Cash Payment
                </h4>
                <p className="text-sm font-bold text-amber-700">
                  Please collect ₱{activeStop?.price} from the resident before completing the task.
                </p>
              </div>
            )}

            <div className="mb-6 flex flex-col items-center">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                className="hidden"
                onChange={handlePhotoCapture}
              />
              {photoPreview ? (
                <div className="relative h-32 w-full overflow-hidden rounded-xl border border-gray-200">
                  <img src={photoPreview} alt="Proof" className="h-full w-full object-cover" />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute right-2 bottom-2 rounded-lg bg-white/90 text-xs shadow-sm backdrop-blur"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Retake
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="h-24 w-full flex-col gap-2 rounded-xl border-dashed border-gray-300 text-gray-500 hover:border-emerald-500 hover:bg-emerald-50/50 hover:text-emerald-600"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-6 w-6" />
                  <span className="text-xs font-semibold">Take Photo Proof</span>
                </Button>
              )}
            </div>

            <div className="flex gap-4">
              <Button
                variant="ghost"
                className="flex-1 rounded-2xl"
                onClick={() => {
                  setShowConfirm(false);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-2xl bg-emerald-600 text-white shadow-lg"
                onClick={confirmPickup}
                disabled={isUploading || updateHauling.isPending}
              >
                {isUploading || updateHauling.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Confirm"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Map Area */}
      <div className="relative flex min-h-[400px] flex-1 flex-col lg:min-h-0">
        <SmartMap
          center={mapCenter}
          zoom={16}
          markers={mapMarkers}
          routes={mapRoutes}
          onMapClick={handleMapClick}
          isCollecting={isCollecting}
          className="h-full w-full"
        />

        <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-3">
          <Card className="flex items-center gap-4 border-0 bg-white/95 p-4 shadow-xl backdrop-blur-md">
            <div
              className={`h-3 w-3 rounded-full ${isCollecting ? "animate-pulse bg-emerald-500" : "bg-orange-500"}`}
            />
            <div className="min-w-0">
              <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                {isPlanning ? "Planning Mode" : "🛰️ Real GPS Active"}
              </p>
              <p className="truncate text-xs font-bold text-gray-900">{gpsAddress}</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Side Actions */}
      <div className="z-10 flex w-full flex-col border-l border-gray-100 bg-white shadow-2xl lg:w-[380px]">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-900">Collection Hub</h2>
              <Badge
                variant={isPlanning ? "outline" : "default"}
                className={isPlanning ? "bg-emerald-50 text-emerald-600" : "bg-emerald-500"}
              >
                {isPlanning ? "Planning Mode" : "On Route"}
              </Badge>
            </div>
            {isPlanning && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  /* Logic to fetch new hauling requests */
                }}
                className="h-9 rounded-xl border-gray-100 bg-white text-[10px] font-black tracking-widest text-emerald-600 uppercase shadow-sm"
              >
                Sync Requests
              </Button>
            )}
          </div>

          {/* Real-time GPS Tracker */}
          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-2.5">
            <span className="text-[9px] font-extrabold tracking-widest text-gray-400 uppercase">
              Tracking Mode
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-[9px] font-black tracking-widest text-emerald-700">
              🛰️ REAL GPS ACTIVE
            </span>
          </div>

          {/* Tabs for Planning Mode */}
          {isPlanning && (
            <div className="mt-2 flex border-b border-gray-100">
              <button
                onClick={() => {
                  setActiveTab("route");
                }}
                className={`flex-1 border-b-2 pb-3 text-center text-xs font-black tracking-wider uppercase transition ${
                  activeTab === "route"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                Planned Route ({stops.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab("invites");
                }}
                className={`relative flex-1 border-b-2 pb-3 text-center text-xs font-black tracking-wider uppercase transition ${
                  activeTab === "invites"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                New Invites ({haulingRequests?.filter((r) => r.status === "pending").length || 0})
                {(haulingRequests?.filter((r) => r.status === "pending").length || 0) > 0 && (
                  <span className="absolute top-0 right-4 h-2 w-2 animate-pulse rounded-full bg-rose-500" />
                )}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 pt-4 pb-6">
          {isPlanning && activeTab === "invites" ? (
            <>
              {!haulingRequests ||
              haulingRequests.filter((r) => r.status === "pending").length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-100 bg-gray-50/50 p-6 text-center">
                  <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                    No new invites
                  </p>
                </div>
              ) : (
                haulingRequests
                  .filter((r) => r.status === "pending")
                  .map((req) => (
                    <Card
                      key={req.id}
                      className="space-y-4 overflow-hidden rounded-3xl border-0 bg-gray-50/50 p-5 shadow-sm"
                    >
                      <div>
                        <p className="text-[10px] font-extrabold tracking-widest text-emerald-600 uppercase">
                          {req.wasteType} waste
                        </p>
                        <h4 className="mt-1 text-sm font-black text-gray-900">
                          {req.pickupAddress}
                        </h4>
                        <p className="mt-1 text-xs font-semibold text-gray-400">
                          Volume: {req.volume}
                        </p>
                        {req.notes && (
                          <p className="mt-2 rounded-xl border border-gray-100 bg-white/85 p-2.5 text-xs font-semibold text-gray-500">
                            {req.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            updateHauling.mutate({ id: req.id, input: { status: "approved" } });
                          }}
                          className="h-9 flex-1 rounded-xl bg-emerald-600 text-[10px] font-black tracking-wider text-white uppercase"
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDeclineRequest(req);
                          }}
                          className="h-9 flex-1 rounded-xl border-rose-200 text-[10px] font-black tracking-wider text-rose-600 uppercase hover:bg-rose-50"
                        >
                          Decline
                        </Button>
                      </div>
                    </Card>
                  ))
              )}
            </>
          ) : (
            <>
              {stops.length === 0 && (
                <div className="flex h-40 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-100 bg-gray-50/50 p-6 text-center">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100/50">
                    <Navigation className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                    {isPlanning
                      ? "Accept invites to start planning your route"
                      : "No stops on route"}
                  </p>
                </div>
              )}
              {stops.map((stop, i) => (
                <Card
                  key={stop.id}
                  className={`overflow-hidden rounded-3xl border-0 shadow-sm transition-all ${stop.status === "active" ? "ring-2 ring-emerald-500 ring-offset-2" : ""}`}
                >
                  <div className="flex items-center gap-4 p-5">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs font-black ${stop.status === "completed" ? "bg-emerald-500 text-white" : "bg-emerald-50"}`}
                    >
                      {stop.status === "completed" ? "✓" : i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-gray-900">{stop.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                          {stop.status}
                        </span>
                        {stop.price !== undefined && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-gray-200" />
                            <Badge
                              className={`rounded-full border-0 px-2 py-0.5 text-[9px] font-bold ${
                                stop.paymentMethod === "cash"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              ₱{stop.price} ·{" "}
                              {stop.paymentMethod === "cash" ? "Collect Cash" : "Paid Online"}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {stop.status === "completed" && (
                    <div className="mx-5 mt-1 mb-5 flex items-start justify-between rounded-xl bg-gray-50 p-2.5">
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase">
                          Collected By
                        </p>
                        <p className="text-xs font-semibold text-gray-900">
                          {stop.completedBy || "Unknown"}
                        </p>
                        <p className="mt-0.5 text-[10px] text-gray-400">{stop.time}</p>
                      </div>
                      {stop.proofPhotoUrl ? (
                        <div className="h-10 w-10 overflow-hidden rounded-lg border border-gray-200">
                          <img
                            src={`${env.NEXT_PUBLIC_SOCKET_URL}${stop.proofPhotoUrl}`}
                            alt="Proof"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200">
                          <ImageIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </>
          )}
        </div>

        <div className="space-y-3 border-t border-gray-100 p-8">
          {isPlanning ? (
            <>
              {stops.length >= 2 && (
                <Button
                  onClick={optimizeRoute}
                  className="h-11 w-full rounded-2xl border border-gray-200 bg-white text-[10px] font-black tracking-widest text-[#0f2419] uppercase shadow-sm transition-all hover:bg-gray-50 active:scale-95"
                >
                  Optimize Stops (TSP)
                </Button>
              )}
              <Button
                onClick={startCollection}
                disabled={stops.length === 0 || isStarting}
                className="h-14 w-full rounded-2xl bg-emerald-600 text-xs font-black tracking-widest text-white uppercase shadow-xl disabled:opacity-50"
              >
                {isStarting ? "Initializing..." : "Start Collecting"}
              </Button>
            </>
          ) : allStopsDone ? (
            <Button
              onClick={finishCollection}
              disabled={isStarting}
              className="h-14 w-full rounded-2xl bg-[#0f2419] text-xs font-black tracking-widest text-white uppercase shadow-xl"
            >
              {isStarting ? "Finishing..." : "Finish Collecting"}
            </Button>
          ) : (
            <>
              <Button
                onClick={() => {
                  setShowConfirm(true);
                }}
                disabled={!activeStop || !isNearby}
                className="h-16 w-full rounded-3xl bg-[#0f2419] text-xs font-black tracking-widest text-white uppercase shadow-xl"
              >
                Confirm Collection
              </Button>
              <p className="mt-2 text-center text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                {isNearby ? "✓ Within Range" : "Moving to next stop..."}
              </p>
            </>
          )}
          {!isPlanning && (
            <Button
              variant="ghost"
              onClick={() => {
                setIsPlanning(true);
                setIsCollecting(false);
                // Notify backend so it doesn't restore "active" state on next login
                if (trackerId) {
                  fetch(`${env.NEXT_PUBLIC_API_URL}/trucks/${trackerId}`, {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({ status: "idle" }),
                  }).catch((error) => {
                    console.error("Failed to sync reset", error);
                  });
                }
              }}
              className="w-full rounded-2xl text-[10px] font-black tracking-widest text-gray-400 uppercase"
            >
              Reset & Edit Route
            </Button>
          )}
        </div>
      </div>

      {/* Decline Reason Modal */}
      {declineRequest && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="mx-4 w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
              <Navigation className="h-8 w-8 rotate-45 text-rose-600" />
            </div>
            <h3 className="mb-2 text-xl font-black text-gray-900">Decline Request?</h3>
            <p className="mb-4 text-sm text-gray-500">
              Provide a reason for declining the collection request from{" "}
              <b>{declineRequest.pickupAddress.split(",")[0]}</b>.
            </p>

            <textarea
              value={declineReason}
              onChange={(e) => {
                setDeclineReason(e.target.value);
              }}
              placeholder="e.g. Road blocked, incorrect waste category, volume too large..."
              className="mb-6 h-24 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 p-3.5 text-sm font-semibold text-gray-800 placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />

            <div className="flex gap-4">
              <Button
                variant="ghost"
                className="flex-1 rounded-2xl font-bold"
                onClick={() => {
                  setDeclineRequest(null);
                  setDeclineReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-2xl bg-rose-600 font-bold text-white shadow-lg"
                onClick={async () => {
                  if (!declineReason.trim()) {
                    toast.error("Please provide a reason");
                    return;
                  }
                  updateHauling.mutate(
                    {
                      id: declineRequest.id,
                      input: { status: "cancelled", declineReason },
                    },
                    {
                      onSuccess: () => {
                        setDeclineRequest(null);
                        setDeclineReason("");
                        toast.success("Request Declined");
                      },
                    },
                  );
                }}
                disabled={updateHauling.isPending}
              >
                {updateHauling.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Decline"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
