import { useEffect } from "react";

import { env } from "@/lib/env";

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
        const response = await fetch(
          `${env.VITE_API_URL}/trucks/${truckId}/location`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${accessToken}`,
            },

            body: JSON.stringify({
              latitude: gpsPos[0],
              longitude: gpsPos[1],
            }),
          },
        );

        if (!response.ok) {
          console.error(
            "Failed to sync driver location:",
            response.status,
          );
        }
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
