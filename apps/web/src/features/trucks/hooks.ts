"use client";

import {
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useSocket } from "@/hooks/use-socket";
import { useEffect, useRef, useState } from "react";
import { getMyTruck, listLiveTrucks, listTrucks } from "./api";
import type { Truck, TruckLocation } from "./schemas";

export const truckKeys = {
  all: ["trucks"] as const,
  lists: () => [...truckKeys.all, "list"] as const,
  tracking: () => [...truckKeys.all, "tracking"] as const,
  mine: () => [...truckKeys.all, "mine"] as const,
};

// The database has no organization model yet, so every user is in org-1.
const ORG_ID = "org-1";

export function useTrucks(): UseQueryResult<Truck[]> {
  return useQuery({
    queryKey: truckKeys.lists(),
    queryFn: listTrucks,
  });
}

/**
 * Subscribes to `truck:location` socket events and keeps the latest position
 * for each truck. `onUnknownTruck` is called the first time a truck id shows
 * up that the caller has not loaded yet, for example a truck that started its
 * route after the page opened.
 */
function useLiveTruckLocations(
  onUnknownTruck?: (truckId: string) => void,
): {
  liveLocations: Record<string, TruckLocation>;
  isConnected: boolean;
} {
  const { socket, isConnected } = useSocket();
  const [liveLocations, setLiveLocations] = useState<
    Record<string, TruckLocation>
  >({});

  const seenIdsRef = useRef<Set<string>>(new Set());
  const onUnknownRef = useRef(onUnknownTruck);
  useEffect(() => {
    onUnknownRef.current = onUnknownTruck;
  }, [onUnknownTruck]);

  useEffect(() => {
    socket.emit("truck:subscribe", { orgId: ORG_ID });

    const handleLocationUpdate = (payload: {
      truckId: string;
      lat: number;
      lng: number;
      timestamp: string;
    }): void => {
      if (!seenIdsRef.current.has(payload.truckId)) {
        seenIdsRef.current.add(payload.truckId);
        onUnknownRef.current?.(payload.truckId);
      }

      setLiveLocations((prev) => ({
        ...prev,
        [payload.truckId]: {
          lat: payload.lat,
          lng: payload.lng,
          timestamp: payload.timestamp,
        },
      }));
    };

    // Rooms are dropped on reconnect, so subscribe again each time.
    const handleConnect = (): void => {
      socket.emit("truck:subscribe", { orgId: ORG_ID });
    };

    socket.on("truck:location", handleLocationUpdate);
    socket.on("connect", handleConnect);

    return () => {
      socket.emit("truck:unsubscribe", { orgId: ORG_ID });
      socket.off("truck:location", handleLocationUpdate);
      socket.off("connect", handleConnect);
    };
  }, [socket]);

  return { liveLocations, isConnected };
}

function withLiveLocation(
  truck: Truck,
  liveLocation: TruckLocation | undefined,
): Truck {
  if (!liveLocation) {
    return truck;
  }

  return {
    ...truck,
    status: "active",
    currentLocation: liveLocation,
  };
}

/**
 * Hook for real-time truck tracking using WebSockets (Socket.IO).
 * Used by the resident Track Truck page, so it loads from the resident-scoped
 * /trucks/live endpoint.
 */
export function useTruckTracking() {
  const queryClient = useQueryClient();
  const { data: initialTrucks = [], ...rest } = useQuery({
    queryKey: truckKeys.tracking(),
    queryFn: listLiveTrucks,
  });

  const knownIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    knownIdsRef.current = new Set(initialTrucks.map((truck) => truck.id));
  }, [initialTrucks]);

  const { liveLocations, isConnected } = useLiveTruckLocations((truckId) => {
    // A truck that was idle when the page loaded is not in the list yet.
    if (!knownIdsRef.current.has(truckId)) {
      void queryClient.invalidateQueries({ queryKey: truckKeys.tracking() });
    }
  });

  const trucks = initialTrucks.map((truck) =>
    withLiveLocation(truck, liveLocations[truck.id]),
  );

  return {
    trucks,
    isConnected,
    ...rest,
  };
}

/**
 * Live position of the truck the signed-in driver or eco-aide works on.
 * `truck` is null when nothing is assigned (the API answers 404).
 */
export function useAssignedTruckTracking() {
  const { data: truck = null, ...rest } = useQuery({
    queryKey: truckKeys.mine(),
    queryFn: getMyTruck,
    retry: false,
  });

  const { liveLocations, isConnected } = useLiveTruckLocations();

  return {
    truck: truck ? withLiveLocation(truck, liveLocations[truck.id]) : null,
    isConnected,
    ...rest,
  };
}
