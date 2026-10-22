import { useEffect } from "react";

import { apiClient } from "@/lib/api-client";

interface UseDriverLocationSyncProps {
  isCollecting: boolean;
  gpsPos: [number, number] | null;
  truckId: string | null;
  accessToken: string | null;
}

export function useDriverLocationSync({
  isCollecting,
  gpsPos,
  truckId,
  accessToken,
}: UseDriverLocationSyncProps) {
  useEffect(() => {
    if (
      !isCollecting ||
      !gpsPos ||
      !truckId ||
      !accessToken
    ) {
      return;
    }

    const sendLocation = async () => {
      try {
        await apiClient.post(
          `/trucks/${truckId}/location`,
          {
            latitude: gpsPos[0],
            longitude: gpsPos[1],
          },
        );
      } catch (error) {
        console.error(
          "Failed to sync driver location:",
          error,
        );
      }
    };

    void sendLocation();
  }, [
    isCollecting,
    gpsPos,
    truckId,
    accessToken,
  ]);
}
