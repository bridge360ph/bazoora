"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useSocket } from "@/hooks/use-socket";
import { useEffect, useState } from "react";
import { listLiveTrucks, listTrucks } from "./api";
import type { Truck } from "./schemas";

export const truckKeys = {
  all: ["trucks"] as const,
  lists: () => [...truckKeys.all, "list"] as const,
  tracking: () => [...truckKeys.all, "tracking"] as const,
};

export function useTrucks(): UseQueryResult<Truck[]> {
  return useQuery({
    queryKey: truckKeys.lists(),
    queryFn: listTrucks,
  });
}

/**
 * Hook for real-time truck tracking using WebSockets (Socket.IO).
 * Used by the resident Track Truck page, so it loads from the resident-scoped
 * /trucks/live endpoint.
 */
export function useTruckTracking() {
  const { data: initialTrucks = [], ...rest } = useQuery({
    queryKey: truckKeys.tracking(),
    queryFn: listLiveTrucks,
  });

  const { socket, isConnected } = useSocket();
  const [liveLocations, setLiveLocations] = useState<Record<string, { lat: number; lng: number }>>({});

  useEffect(() => {
    if (!socket) return;

    // Join organization room for real-time updates
    const orgId = "org-1"; 
    socket.emit("truck:subscribe", { orgId });

    const handleLocationUpdate = (payload: {
      truckId: string;
      lat: number;
      lng: number;
      timestamp: string;
    }) => {
      setLiveLocations((prev) => ({
        ...prev,
        [payload.truckId]: { lat: payload.lat, lng: payload.lng },
      }));
    };

    socket.on("truck:location", handleLocationUpdate);

    return () => {
      socket.emit("truck:unsubscribe", { orgId });
      socket.off("truck:location", handleLocationUpdate);
    };
  }, [socket]);

  // Merge live WebSocket locations into the trucks list
  const trucks = initialTrucks.map((truck) => {
    const liveLoc = liveLocations[truck.id];
    if (liveLoc) {
      return {
        ...truck,
        status: "active" as const,
        currentLocation: {
          lat: liveLoc.lat,
          lng: liveLoc.lng,
          timestamp: new Date().toISOString(),
        },
      };
    }
    return truck;
  });

  return {
    trucks,
    isConnected,
    ...rest,
  };
}
