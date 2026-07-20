/* eslint-disable unicorn/no-abusive-eslint-disable */
/* eslint-disable */
"use client";

import { DashboardCard, Button, StatusBadge } from "@bazoora/ui";
import SmartMap from "@/components/map/smart-map";
import {
  MapPin,
  Loader2,
  Truck,
  Camera,
  Image as ImageIcon,
  AlertTriangle,
  Battery,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useCreatePickupNotification } from "@/features/notifications/hooks";
import { reverseGeocode } from "@/lib/geocoding";
import { toast } from "sonner";
import { LocationPermissionModal } from "@/components/ui/location-permission";
import { env } from "@/lib/env";
import type { MapMarker, MapRoute } from "@/components/map/smart-map";
import { compressImage } from "@/lib/image-compress";
import { calculateRoute } from "@/lib/routing";

interface Stop {
  id: string;
  number: string;
  name: string;
  detail: string;
  lat: number;
  lng: number;
  status: string;
  time?: string | undefined;
  proofPhotoUrl?: string | null | undefined;
  completedBy?: string | undefined;
  isGPSVerified?: boolean;
  dwellTimeSeconds?: number;
  verificationMethod?: "manual_photo" | "gps_auto" | "force_skip" | "skipped_exception";
  skipReason?: "blocked_access" | "no_bin_out" | "contamination" | "road_detour" | null;
}

const PROXIMITY_THRESHOLD_M = 150;

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function DriverRoute(): React.ReactNode {
  const user = useAuthStore((s) => s.user);
  const createPickup = useCreatePickupNotification();

  // State
  const [stops, setStops] = useState<Stop[]>([]);
  const [isPlanning, setIsPlanning] = useState(true);
  const [isCollecting, setIsCollecting] = useState(false);
  const [gpsPos, setGpsPos] = useState<[number, number] | null>(null);
  const [gpsAddress, setGpsAddress] = useState("Awaiting GPS...");
  const [showConfirm, setShowConfirm] = useState(false);
  const [truckId, setTruckId] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoDriveTimer = useRef<any | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [isSimulated, setIsSimulated] = useState(true);

  // Edge-case & Offline states
  const [dwellTime, setDwellTime] = useState(0);
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [selectedSkipReason, setSelectedSkipReason] = useState<string | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number>(100);
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);

  // Navigation HUD states
  const [navigationSteps, setNavigationSteps] = useState<any[]>([]);
  const [routeSummary, setRouteSummary] = useState<
    { distance: number; duration: number } | undefined
  >(undefined);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);

  const totalRouteDistanceRef = useRef<number>(0);
  const totalRouteDurationRef = useRef<number>(0);
  const totalPathNodesRef = useRef<number>(0);

  /* ── Fetch Assigned Truck ──────────────────────────────────────── */
  useEffect(() => {
    if (!accessToken || accessToken === "null") return;

    async function getMyTruck() {
      try {
        const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/trucks/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const json = await res.json();
        if (json.success && json.data) {
          const truck = json.data;
          setTruckId(truck.id);

          // Restore saved route if it exists
          if (truck.plannedRoute && truck.plannedRoute.length > 0) {
            setStops(truck.plannedRoute);

            // If already on route, restore UI state
            if (truck.status === "active") {
              setIsPlanning(false);
              setIsCollecting(true);

              // Restore GPS position if available
              if (truck.currentLocation) {
                setGpsPos([truck.currentLocation.lat, truck.currentLocation.lng]);
              }

              // RE-CALCULATE SIMULATION PATH to resume movement
              const remaining = truck.plannedRoute.filter((s: any) => s.status !== "completed");
              const waypoints = remaining.map((s: any) => [s.lng, s.lat] as [number, number]);
              if (waypoints.length >= 2) {
                calculateRoute(waypoints, {
                  profile: "driving",
                  steps: true,
                  bannerInstructions: true,
                })
                  .then((route) => {
                    const coords = route.geometry.coordinates.map(
                      ([lng, lat]) => [lat, lng] as [number, number],
                    );
                    simulationPathRef.current = coords;
                    setRoutePath(coords);
                    setNavigationSteps(route.legs?.[0]?.steps ?? []);
                    setRouteSummary({ distance: route.distance, duration: route.duration });
                    totalRouteDistanceRef.current = route.distance;
                    totalRouteDurationRef.current = route.duration;
                    totalPathNodesRef.current = coords.length;
                  })
                  .catch((error) => {
                    console.error("Restore simulation path failed", error);
                  });
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch assigned truck", error);
      }
    }
    getMyTruck();
  }, [accessToken]);

  /* ── Auto-Drive Simulation ────────────────────────── */
  const simulationPathRef = useRef<[number, number][]>([]);
  // Active stop is the one currently being serviced
  const activeStop = stops.find((s) => s.status === "active");
  const allStopsDone = stops.length > 0 && stops.every((s) => s.status === "completed");

  useEffect(() => {
    if (!isCollecting || !truckId || !isSimulated) {
      if (autoDriveTimer.current) clearInterval(autoDriveTimer.current);
      return;
    }

    autoDriveTimer.current = setInterval(() => {
      if (!activeStop) return;

      setGpsPos((prev) => {
        if (!prev) return prev;

        // Simulation pause: stop when really close to the active stop (e.g., 20m)
        const distanceToActive = haversineMeters(prev[0], prev[1], activeStop.lat, activeStop.lng);
        if (distanceToActive <= 20) return prev;

        let targetLat = activeStop.lat;
        let targetLng = activeStop.lng;

        const currentPath = simulationPathRef.current;
        if (currentPath.length > 0 && currentPath[0]) {
          targetLat = currentPath[0][0];
          targetLng = currentPath[0][1];

          const distToNode = haversineMeters(prev[0], prev[1], targetLat, targetLng);
          if (distToNode < 10 && currentPath.length > 1) {
            currentPath.shift();
            const nextNode = currentPath[0];
            if (nextNode) {
              targetLat = nextNode[0];
              targetLng = nextNode[1];
            }
          } else if (distToNode < 10 && currentPath.length === 1) {
            // Reached the end of the road-snapped path, move directly to the stop coords
            currentPath.shift();
            targetLat = activeStop.lat;
            targetLng = activeStop.lng;
          }
        }

        const distToTarget = haversineMeters(prev[0], prev[1], targetLat, targetLng);

        // If we are extremely close to the target node, just jump to it
        if (distToTarget < 2) {
          return [targetLat, targetLng];
        }

        // Calculate step (constant speed simulation)
        // 0.00008 degrees is approx 8-9 meters.
        // At 1.5s interval, this is ~20km/h
        const moveStep = 0.000_08;
        const latDiff = targetLat - prev[0];
        const lngDiff = targetLng - prev[1];
        const angle = Math.atan2(latDiff, lngDiff);

        const nextLat = prev[0] + Math.sin(angle) * moveStep;
        const nextLng = prev[1] + Math.cos(angle) * moveStep;

        // Don't overshot the target
        if (haversineMeters(prev[0], prev[1], nextLat, nextLng) > distToTarget) {
          return [targetLat, targetLng];
        }

        fetch(`${env.NEXT_PUBLIC_API_URL}/trucks/${truckId}/location`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
          },
          body: JSON.stringify({
            lat: nextLat,
            lng: nextLng,
            timestamp: new Date().toISOString(),
          }),
        }).catch((error) => {
          console.error("Simulation push failed", error);
        });

        return [nextLat, nextLng];
      });
    }, 1500);

    return () => {
      if (autoDriveTimer.current) clearInterval(autoDriveTimer.current);
    };
  }, [isCollecting, activeStop?.id, truckId, isSimulated]);

  // Dynamic navigation progress updates based on GPS coordinates
  useEffect(() => {
    if (!isCollecting || !gpsPos || !routeSummary || routePath.length === 0) return;

    const [lat, lng] = gpsPos;
    const currentPath = simulationPathRef.current;
    const totalNodes = totalPathNodesRef.current;
    const remainingNodes = currentPath.length;

    if (totalNodes > 0) {
      const progressRatio = Math.min(1, (totalNodes - remainingNodes) / totalNodes);

      // Update remaining ETA stats dynamically
      setRouteSummary((prevSum) => {
        if (!prevSum) return prevSum;
        const originalDist = totalRouteDistanceRef.current;
        const originalDur = totalRouteDurationRef.current;
        return {
          distance: Math.max(0, originalDist * (1 - progressRatio)),
          duration: Math.max(0, originalDur * (1 - progressRatio)),
        };
      });
    }

    // Update instruction distance and transition to next step
    setNavigationSteps((prevSteps) => {
      if (prevSteps.length === 0) return prevSteps;
      const [firstStep, ...rest] = prevSteps;
      if (!firstStep) return prevSteps;

      if (firstStep.maneuver?.location) {
        const mLoc = firstStep.maneuver.location; // [lng, lat]
        const distToManeuver = haversineMeters(lat, lng, mLoc[1], mLoc[0]);

        // If we are extremely close (e.g. < 25 meters), trigger next step
        if (distToManeuver < 25 && rest.length > 0) {
          return rest;
        }

        return [
          {
            ...firstStep,
            distance: distToManeuver,
          },
          ...rest,
        ];
      }
      return prevSteps;
    });
  }, [gpsPos, isCollecting, routePath.length]);

  /* ── Real GPS Tracking Mode ────────────────────────────────────── */
  useEffect(() => {
    if (!isCollecting || isSimulated || !truckId) {
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
          await fetch(`${env.NEXT_PUBLIC_API_URL}/trucks/${truckId}/location`, {
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
        maximumAge: 30000,
        timeout: 30000,
      },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isCollecting, isSimulated, truckId, accessToken]);

  /* ── Initial Location ──────────────────────────────────────────── */
  const detectGps = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setGpsPos([lat, lng]);
        try {
          const result = await reverseGeocode(lat, lng);
          setGpsAddress(result.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } catch {
          setGpsAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      },
      () => {
        setGpsPos([13.8248, 121.3964]);
        setGpsAddress("San Juan, Batangas (demo)");
      },
    );
  }, []);

  /* ── Route Planning ────────────────────────────────────────────── */
  const handleMapClick = async (pos: [number, number]) => {
    if (!isPlanning) return;

    const stopId = Math.random().toString(36).slice(2, 11);
    const stopNumber = (stops.length + 1).toString().padStart(2, "0");

    const newStop: Stop = {
      id: stopId,
      number: stopNumber,
      name: "Locating...",
      detail: "Planned Stop",
      lat: pos[0],
      lng: pos[1],
      status: "pending",
    };

    setStops((prev) => [...prev, newStop]);

    try {
      const geo = await reverseGeocode(pos[0], pos[1]);
      setStops((prev) =>
        prev.map((s) =>
          s.id === stopId ? { ...s, name: geo.display_name?.split(",")[0] || "Planned Stop" } : s,
        ),
      );
    } catch {
      setStops((prev) =>
        prev.map((s) => (s.id === stopId ? { ...s, name: `Stop ${stopNumber}` } : s)),
      );
    }
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
    const optimized: Stop[] = [];
    let currentPos = startingPos;

    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const stop = unvisited[i];
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

    // Re-index stop numbers
    const reindexed = optimized.map((s, idx) => ({
      ...s,
      number: (idx + 1).toString().padStart(2, "0"),
    }));

    setStops(reindexed);
    toast.success("Route Optimized", {
      description: "Stops rearranged using nearest-neighbor algorithm.",
    });
  };

  const startCollection = async () => {
    if (stops.length === 0) return;

    if (!truckId) {
      toast.error("No vehicle assigned", {
        description: "Wait for vehicle connection or check assignment.",
      });
      return;
    }

    setIsStarting(true);

    const activeStops = stops.map((s, i) => (i === 0 ? { ...s, status: "active" as const } : s));

    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/trucks/${truckId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
        body: JSON.stringify({
          plannedRoute: activeStops,
          status: "active",
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      setStops(activeStops);
    } catch (error: any) {
      console.error("Failed to sync route", error);
      toast.error("Sync Failed", {
        description: error.message || "Could not push route to server.",
      });
    } finally {
      setIsStarting(false);
    }

    // 1. Fetch full route geometry starting from the first stop
    try {
      let waypoints = activeStops.map((s) => [s.lng, s.lat] as [number, number]);
      if (waypoints.length === 1 && gpsPos) {
        waypoints = [[gpsPos[1], gpsPos[0]], ...waypoints];
      }

      if (waypoints.length >= 2) {
        const route = await calculateRoute(waypoints, {
          profile: "driving",
          steps: true,
          bannerInstructions: true,
        });
        const coords = route.geometry.coordinates.map(
          ([lng, lat]) => [lat, lng] as [number, number],
        );
        simulationPathRef.current = coords;
        setRoutePath(coords);
        setNavigationSteps(route.legs?.[0]?.steps ?? []);
        setRouteSummary({ distance: route.distance, duration: route.duration });
        totalRouteDistanceRef.current = route.distance;
        totalRouteDurationRef.current = route.duration;
        totalPathNodesRef.current = coords.length;
      } else {
        simulationPathRef.current = [];
        setRoutePath([]);
        setNavigationSteps([]);
        setRouteSummary(undefined);
      }
    } catch (error) {
      console.error("Failed to pre-fetch simulation route", error);
    }

    // Initialize GPS to the first stop
    if (activeStops[0]) {
      setGpsPos([activeStops[0].lat, activeStops[0].lng]);
    }

    setIsPlanning(false);
    setIsCollecting(true);
  };

  /* ── Active stop & Proximity ───────────────────────────────────── */
  const distanceToActive =
    gpsPos && activeStop
      ? haversineMeters(gpsPos[0], gpsPos[1], activeStop.lat, activeStop.lng)
      : Infinity;
  const isNearby = distanceToActive < PROXIMITY_THRESHOLD_M;

  /* ── Map state ───────────────────────────────────────── */
  const mapCenter: [number, number] = gpsPos ?? [13.8248, 121.3964];

  const mapMarkers: MapMarker[] = [
    ...(gpsPos
      ? [
          {
            id: "truck-main",
            position: gpsPos,
            label: "You (Truck)",
            icon: "truck" as const,
            pulse: isCollecting,
          },
        ]
      : []),
    ...stops.map((stop) => ({
      id: `stop-${stop.id}`,
      position: [stop.lat, stop.lng] as [number, number],
      label: stop.name,
      icon: (stop.status === "completed" ? "done" : "pending") as any,
      pulse: stop.status === "active",
    })),
  ];
  const mapRoutes: MapRoute[] =
    !isPlanning && isCollecting && routePath.length > 1
      ? [
          {
            path: routePath,
            color: "blue",
            label: "Driver Route",
          },
        ]
      : isPlanning && stops.length >= 2
        ? [
            {
              waypoints: stops.map((s) => [s.lng, s.lat] as [number, number]),
              color: "blue",
              label: "Planned Route",
            },
          ]
        : [];

  /* ── Mark picked up ────────────────────────────────────────────── */
  const handleMarkPickedUp = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setShowConfirm(true);
  };

  const finishCollection = async () => {
    if (!truckId) return;
    setIsStarting(true);
    try {
      await fetch(`${env.NEXT_PUBLIC_API_URL}/trucks/${truckId}/finish-route`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setIsPlanning(true);
      setIsCollecting(false);
      setStops([]);
      setGpsPos(null);
      simulationPathRef.current = [];
      detectGps(); // Trigger re-detection
      toast.success("Route Completed", { description: "You have finished the collection route." });
    } catch (error: any) {
      toast.error("Finish Failed", { description: error.message });
    } finally {
      setIsStarting(false);
    }
  };

  const recalculateSimulationPath = useCallback(
    async (nextStops: Stop[]) => {
      try {
        const remaining = nextStops.filter((s) => s.status !== "completed");
        if (remaining.length === 0) {
          simulationPathRef.current = [];
          setRoutePath([]);
          setNavigationSteps([]);
          setRouteSummary(undefined);
          return;
        }

        const waypoints: [number, number][] = [
          gpsPos ? [gpsPos[1], gpsPos[0]] : [121.3967, 13.8252],
          ...remaining.map((s) => [s.lng, s.lat] as [number, number]),
        ];

        if (waypoints.length >= 2) {
          const route = await calculateRoute(waypoints, {
            profile: "driving",
            steps: true,
            bannerInstructions: true,
          });
          const coords = route.geometry.coordinates.map(
            ([lng, lat]) => [lat, lng] as [number, number],
          );
          simulationPathRef.current = coords;
          setRoutePath(coords);
          setNavigationSteps(route.legs?.[0]?.steps ?? []);
          setRouteSummary({ distance: route.distance, duration: route.duration });
          totalRouteDistanceRef.current = route.distance;
          totalRouteDurationRef.current = route.duration;
          totalPathNodesRef.current = coords.length;
        } else {
          simulationPathRef.current = [];
          setRoutePath([]);
          setNavigationSteps([]);
          setRouteSummary(undefined);
        }
      } catch (error) {
        console.error("Failed to recalc route after pickup", error);
      }
    },
    [gpsPos],
  );

  // Save pickup details locally when offline
  const savePickupOffline = useCallback((pickup: any) => {
    try {
      const queue = JSON.parse(localStorage.getItem("bazoora_offline_pickups") || "[]");
      queue.push(pickup);
      localStorage.setItem("bazoora_offline_pickups", JSON.stringify(queue));
      toast.warning("Offline Mode Triggered", {
        description: "Pickup saved locally. Will sync automatically when network is restored.",
      });
    } catch (error) {
      console.error("Failed to save offline pickup:", error);
    }
  }, []);

  // Sync queued offline items to server
  const syncOfflineQueue = useCallback(async () => {
    if (!navigator.onLine || !accessToken || accessToken === "null" || !truckId) return;

    const queue = JSON.parse(localStorage.getItem("bazoora_offline_pickups") || "[]");
    if (queue.length === 0) return;

    toast.info("Network Restored", { description: "Syncing offline routes..." });
    const remainingQueue: any[] = [];

    for (const item of queue) {
      try {
        let uploadedUrl: string | undefined = undefined;

        if (item.base64Photo) {
          const uploadRes = await fetch(`${env.NEXT_PUBLIC_API_URL}/uploads/image`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ base64: item.base64Photo, mimeType: "image/jpeg" }),
          });
          const uploadData = await uploadRes.json();
          if (uploadData.success) {
            uploadedUrl = uploadData.data.url;
          }
        }

        // Apply URL and upload route
        const routeToSync = item.plannedRoute.map((s: any) => {
          if (s.id === item.stopId && uploadedUrl) {
            return { ...s, proofPhotoUrl: uploadedUrl };
          }
          return s;
        });

        await fetch(`${env.NEXT_PUBLIC_API_URL}/trucks/${truckId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ plannedRoute: routeToSync }),
        });
      } catch (err) {
        console.error("Failed to sync offline item, queuing again:", err);
        remainingQueue.push(item);
      }
    }

    localStorage.setItem("bazoora_offline_pickups", JSON.stringify(remainingQueue));
    if (remainingQueue.length === 0) {
      toast.success("Sync Complete", {
        description: "All offline collections successfully verified.",
      });
    }
  }, [accessToken, truckId]);

  // Handle offline-to-online trigger
  useEffect(() => {
    const handleOnline = () => {
      syncOfflineQueue();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [syncOfflineQueue]);

  // Monitor battery status to toggle Power Save Mode
  useEffect(() => {
    if (typeof window === "undefined" || !("getBattery" in navigator)) return;

    let battery: any = null;

    const updateBatteryInfo = () => {
      if (!battery) return;
      const level = Math.round(battery.level * 100);
      setBatteryLevel(level);

      const isLow = level < 20 && !battery.charging;
      setIsLowPowerMode(isLow);
    };

    (navigator as any).getBattery().then((batt: any) => {
      battery = batt;
      updateBatteryInfo();
      batt.addEventListener("levelchange", updateBatteryInfo);
      batt.addEventListener("chargingchange", updateBatteryInfo);
    });

    return () => {
      if (battery) {
        battery.removeEventListener("levelchange", updateBatteryInfo);
        battery.removeEventListener("chargingchange", updateBatteryInfo);
      }
    };
  }, []);

  // Proximity & Dwell-Time Auto Completion Loop
  useEffect(() => {
    if (!isCollecting || !gpsPos || !activeStop || !truckId) return;

    const distance = haversineMeters(gpsPos[0], gpsPos[1], activeStop.lat, activeStop.lng);
    let interval: any = null;

    // If within geofence of 20 meters, count dwell time
    if (distance <= 20) {
      interval = setInterval(() => {
        setDwellTime((prev) => {
          const nextVal = prev + 1;
          if (nextVal >= 8) {
            if (interval) clearInterval(interval);
            triggerPassiveAutoComplete();
            return 0;
          }
          return nextVal;
        });
      }, 1000);
    } else {
      setDwellTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gpsPos, activeStop, isCollecting, truckId]);

  // Passive Auto-Complete when truck is stationary at geofence
  const triggerPassiveAutoComplete = async () => {
    if (!activeStop || !truckId) return;

    toast.info("Auto-Completing Stop", {
      description: "Truck spent 8+ seconds at geofence destination.",
    });

    const completedTime = new Date().toLocaleTimeString();
    const driverName = user?.firstName ? `${user.firstName} ${user.lastName}` : "Driver";

    const nextStops = stops.map((s) => {
      if (s.id === activeStop.id) {
        return {
          ...s,
          status: "completed" as const,
          time: completedTime,
          completedAt: completedTime,
          proofPhotoUrl: null,
          completedBy: driverName,
          isGPSVerified: true,
          dwellTimeSeconds: 8,
          verificationMethod: "gps_auto" as const,
        };
      }
      return s;
    });

    const idx = nextStops.findIndex((s) => s.id === activeStop.id);
    if (idx + 1 < nextStops.length) {
      nextStops[idx + 1] = { ...nextStops[idx + 1], status: "active" } as any;
    }

    setStops(nextStops);
    recalculateSimulationPath(nextStops);

    if (!navigator.onLine) {
      savePickupOffline({
        stopId: activeStop.id,
        truckId,
        status: "completed",
        timestamp: new Date().toISOString(),
        plannedRoute: nextStops,
      });
      return;
    }

    try {
      await fetch(`${env.NEXT_PUBLIC_API_URL}/trucks/${truckId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ plannedRoute: nextStops }),
      });
    } catch (error) {
      console.error("Auto-complete sync failed, caching offline:", error);
      savePickupOffline({
        stopId: activeStop.id,
        truckId,
        status: "completed",
        timestamp: new Date().toISOString(),
        plannedRoute: nextStops,
      });
    }
  };

  // Skip stop with exception code
  const skipActiveStop = async (reason: string) => {
    if (!activeStop || !truckId) return;
    setIsUploading(true);

    const completedTime = new Date().toLocaleTimeString();
    const driverName = user?.firstName ? `${user.firstName} ${user.lastName}` : "Driver";

    const nextStops = stops.map((s) => {
      if (s.id === activeStop.id) {
        return {
          ...s,
          status: "completed" as const,
          time: completedTime,
          completedAt: completedTime,
          proofPhotoUrl: null,
          completedBy: driverName,
          isGPSVerified: true,
          verificationMethod: "skipped_exception" as const,
          skipReason: reason as any,
        };
      }
      return s;
    });

    const idx = nextStops.findIndex((s) => s.id === activeStop.id);
    if (idx + 1 < nextStops.length) {
      nextStops[idx + 1] = { ...nextStops[idx + 1], status: "active" } as any;
    }

    setStops(nextStops);
    recalculateSimulationPath(nextStops);

    if (!navigator.onLine) {
      savePickupOffline({
        stopId: activeStop.id,
        truckId,
        status: "skipped",
        timestamp: new Date().toISOString(),
        plannedRoute: nextStops,
        skipReason: reason,
      });
      setShowReportIssue(false);
      setIsUploading(false);
      return;
    }

    try {
      await fetch(`${env.NEXT_PUBLIC_API_URL}/trucks/${truckId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ plannedRoute: nextStops }),
      });
      setShowReportIssue(false);
      toast.success("Stop skipped, logged issue!");
    } catch (error) {
      console.error("Failed to skip stop on server:", error);
      savePickupOffline({
        stopId: activeStop.id,
        truckId,
        status: "skipped",
        timestamp: new Date().toISOString(),
        plannedRoute: nextStops,
        skipReason: reason,
      });
      setShowReportIssue(false);
    } finally {
      setIsUploading(false);
    }
  };

  const confirmPickup = async () => {
    if (!activeStop || !truckId) return;
    setIsUploading(true);
    let uploadedUrl: string | null = null;

    try {
      const completedTime = new Date().toLocaleTimeString();
      const driverName = user?.firstName ? `${user.firstName} ${user.lastName}` : "Driver";
      let base64Photo: string | undefined = undefined;

      if (photoFile) {
        const { base64 } = await compressImage(photoFile);
        base64Photo = base64;
      }

      if (navigator.onLine && base64Photo && photoFile) {
        const { mimeType } = await compressImage(photoFile);
        const uploadRes = await fetch(`${env.NEXT_PUBLIC_API_URL}/uploads/image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ base64: base64Photo, mimeType }),
        });

        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          uploadedUrl = uploadData.data.url;
        } else {
          throw new Error("Failed to upload image");
        }
      }

      const nextStops = stops.map((s) => {
        if (s.id === activeStop.id) {
          return {
            ...s,
            status: "completed" as const,
            time: completedTime,
            completedAt: completedTime,
            proofPhotoUrl: uploadedUrl ?? undefined,
            completedBy: driverName,
            isGPSVerified: true,
            dwellTimeSeconds: dwellTime,
            verificationMethod: "manual_photo" as const,
          };
        }
        return s;
      });

      const idx = nextStops.findIndex((s) => s.id === activeStop.id);
      if (idx + 1 < nextStops.length) {
        nextStops[idx + 1] = { ...nextStops[idx + 1], status: "active" } as any;
      }

      setStops(nextStops);
      recalculateSimulationPath(nextStops);

      if (!navigator.onLine) {
        savePickupOffline({
          stopId: activeStop.id,
          truckId,
          status: "completed",
          base64Photo,
          timestamp: new Date().toISOString(),
          plannedRoute: nextStops,
        });
        setShowConfirm(false);
        setIsUploading(false);
        return;
      }

      await fetch(`${env.NEXT_PUBLIC_API_URL}/trucks/${truckId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ plannedRoute: nextStops }),
      });

      setShowConfirm(false);
      toast.success("Pickup confirmed!");
    } catch (error) {
      console.error("Pickup confirmation failed:", error);
      toast.error("Error", { description: "Failed to confirm pickup." });
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
    <div className="relative flex h-full flex-col overflow-hidden bg-[#F5F5F5] lg:flex-row">
      <LocationPermissionModal onAllow={detectGps} />
      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <Truck className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="mb-1 text-lg font-black text-gray-900">Confirm Pickup</h3>
            <p className="mb-4 text-sm text-gray-600">
              Mark <b>{activeStop?.name}</b> as collected?
            </p>

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
                  className="h-24 w-full flex-col gap-2 rounded-xl border-dashed border-gray-300 text-gray-500 hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-600"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-6 w-6" />
                  <span className="text-xs font-semibold">Take Photo Proof</span>
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => {
                  setShowConfirm(false);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl bg-blue-600 text-white"
                onClick={confirmPickup}
                disabled={isUploading || createPickup.isPending}
              >
                {isUploading || createPickup.isPending ? (
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
      <div className="relative flex min-h-[420px] flex-1 flex-col p-4 lg:min-h-0 lg:p-6">
        <div className="relative flex-1 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl">
          {isLowPowerMode ? (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gray-50/50 p-6 text-center">
              <Battery className="mb-4 h-12 w-12 animate-pulse text-amber-500" />
              <h3 className="mb-2 text-lg font-black text-gray-900">Power Saver Mode Active</h3>
              <p className="max-w-xs text-xs text-gray-500">
                Battery is below 20%. Live Map rendering has been suspended to conserve battery for
                GPS tracking.
              </p>
              <div className="mt-6 flex flex-col items-center gap-1">
                <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                  Current Battery
                </span>
                <span className="text-2xl font-black text-amber-600">{batteryLevel}%</span>
              </div>
            </div>
          ) : (
            <SmartMap
              center={mapCenter}
              zoom={16}
              markers={mapMarkers}
              routes={mapRoutes}
              onMapClick={handleMapClick}
              isCollecting={isCollecting}
              navigationSteps={navigationSteps}
              routeSummary={routeSummary}
              className="h-full w-full"
            />
          )}

          {isPlanning && (
            <div className="absolute top-4 left-1/2 z-[1000] -translate-x-1/2">
              <div className="flex items-center gap-3 rounded-full bg-[#0f2419] px-4 py-2.5 text-white shadow-xl">
                <MapPin className="h-3 w-3 animate-pulse text-blue-500" />
                <span className="text-[11px] font-black tracking-widest uppercase">
                  Planning Mode: Click map to add stops
                </span>
              </div>
            </div>
          )}

          <div className="absolute bottom-6 left-6 z-[1000]">
            <DashboardCard className="min-w-[240px] border-gray-200 dark:border-slate-800 bg-white/90 p-4 shadow-2xl backdrop-blur-md">
              <p className="mb-2 text-[9px] font-black tracking-widest text-gray-400 uppercase">
                Truck Status
              </p>
              <p className="mb-1 truncate text-xs font-bold text-gray-900">{gpsAddress}</p>
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${isCollecting ? "animate-pulse bg-emerald-500" : "bg-gray-300"}`}
                />
                <span className="text-[10px] font-bold text-gray-500">
                  {isCollecting
                    ? isSimulated
                      ? "Auto-Drive Active"
                      : "🛰️ Real GPS Active"
                    : "Idle"}
                </span>
              </div>
            </DashboardCard>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="z-10 flex w-full flex-col border-l border-gray-100 bg-white shadow-lg lg:w-[360px]">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900">Collection Hub</h2>
            <StatusBadge status={isPlanning ? "Planning Mode" : "On Route"} />
          </div>

          {/* Real-time GPS Tracker Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-2.5">
            <span className="text-[9px] font-extrabold tracking-widest text-gray-400 uppercase">
              Tracking Mode
            </span>
            <button
              type="button"
              onClick={() => {
                setIsSimulated(!isSimulated);
                toast.success(isSimulated ? "Real GPS Tracking Enabled" : "Simulated Path Enabled");
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[9px] font-black tracking-widest transition-all duration-200 active:scale-95 ${
                isSimulated
                  ? "border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100/75"
                  : "animate-pulse border border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/75"
              }`}
            >
              {isSimulated ? "🤖 SIMULATOR" : "🛰️ REAL GPS"}
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50/30 p-5">
          {stops.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center opacity-40">
              <MapPin className="mb-2 h-10 w-10 text-gray-300" />
              <p className="text-xs font-medium">
                Click on the map to
                <br />
                plan your route stops
              </p>
            </div>
          )}
          {stops.map((stop) => (
            <div
              key={stop.id}
              className={`rounded-2xl border p-4 transition-all ${stop.status === "active" ? "border-blue-600 bg-blue-600 text-white shadow-lg" : "bg-white text-gray-900"}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span
                  className={`text-[10px] font-black uppercase ${stop.status === "active" ? "text-white/60" : "text-gray-400"}`}
                >
                  Stop {stop.number}
                </span>
                {stop.status === "completed" && (
                  <span className="inline-flex items-center rounded-full bg-emerald-500 px-2 py-0.5 text-[8px] font-black text-[#0a1811]">COLLECTED</span>
                )}
              </div>
              <p className="text-sm font-black tracking-tight">{stop.name}</p>

              {stop.status === "completed" && (
                <div className="mt-3 flex items-start justify-between rounded-xl bg-gray-50 p-2.5">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Collected By</p>
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
            </div>
          ))}
        </div>

        <div className="space-y-3 border-t border-gray-100 p-6">
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
                className="h-14 w-full rounded-2xl bg-[#0f2419] text-xs font-black tracking-widest text-white uppercase shadow-xl disabled:opacity-50"
              >
                {isStarting ? "Initializing..." : "Start Collecting"}
              </Button>
            </>
          ) : allStopsDone ? (
            <Button
              onClick={finishCollection}
              disabled={isStarting}
              className="h-14 w-full rounded-2xl bg-emerald-600 text-xs font-black tracking-widest text-white uppercase shadow-xl"
            >
              {isStarting ? "Finishing..." : "Finish Collecting"}
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleMarkPickedUp}
                disabled={!activeStop || !isNearby}
                className="h-14 w-full rounded-2xl bg-blue-600 text-xs font-black tracking-widest text-white uppercase shadow-xl"
              >
                Mark as Picked Up
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowReportIssue(true)}
                disabled={!activeStop}
                className="h-11 w-full rounded-2xl border border-red-200 bg-red-50/50 text-[10px] font-black tracking-widest text-red-600 uppercase transition-all hover:bg-red-100 hover:text-red-700 active:scale-95"
              >
                <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Skip Stop / Report Issue
              </Button>

              <p className="text-center text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                {isNearby ? "✓ Within Range" : "Moving to next stop..."}
              </p>
            </div>
          )}

          {!isPlanning && (
            <Button
              variant="ghost"
              onClick={async () => {
                setIsPlanning(true);
                setIsCollecting(false);
                setStops([]);
                setGpsPos(null);
                simulationPathRef.current = [];
                setRoutePath([]);
                setNavigationSteps([]);
                setRouteSummary(undefined);
                detectGps();
                // Notify backend so it doesn't restore "active" state on next login
                if (truckId) {
                  fetch(`${env.NEXT_PUBLIC_API_URL}/trucks/${truckId}`, {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({ status: "idle", plannedRoute: [] }),
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
      {/* Skip Stop / Report Issue Modal */}
      {showReportIssue && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-7 w-7 text-red-600" />
            </div>
            <h3 className="mb-1 text-lg font-black text-gray-900">Skip Stop / Report Issue</h3>
            <p className="mb-4 text-xs text-gray-500">
              Select the reason why you are skipping <b>{activeStop?.name}</b>:
            </p>

            <div className="mb-6 flex flex-col gap-2">
              {[
                { value: "blocked_access", label: "Blocked Access (Parked Car/Gate)" },
                { value: "no_bin_out", label: "No Bin Out / No Waste on Curb" },
                { value: "contamination", label: "Contaminated / Overloaded Waste" },
                { value: "road_detour", label: "Road Detour / Street Closed" },
              ].map((reason) => (
                <button
                  key={reason.value}
                  type="button"
                  onClick={() => setSelectedSkipReason(reason.value)}
                  className={`w-full rounded-xl border p-3.5 text-left text-xs font-black tracking-wide transition-all ${
                    selectedSkipReason === reason.value
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-100 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {reason.label}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => {
                  setShowReportIssue(false);
                  setSelectedSkipReason(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl bg-red-600 text-white hover:bg-red-700"
                onClick={() => {
                  if (selectedSkipReason) {
                    skipActiveStop(selectedSkipReason);
                  } else {
                    toast.error("Please select a reason");
                  }
                }}
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="animate-spin" /> : "Skip Stop"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
