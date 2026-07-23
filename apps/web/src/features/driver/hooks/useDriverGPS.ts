import { useEffect, useState } from "react";

interface DriverGPSState {
  gpsPos: [number, number] | null;
  heading: number;
  accuracy: number | null;
  error: string | null;
}

export function useDriverGPS(
  {
    enabled = true,
  }: {
    enabled?: boolean;
  } = {}
): DriverGPSState {
  const [gpsPos, setGpsPos] = useState<[number, number] | null>(null);
  const [heading, setHeading] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  if (!navigator.geolocation) {
    queueMicrotask(() => {
      setError("Geolocation is not supported by this browser");
    });

    return;
  }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const {
          latitude,
          longitude,
          accuracy,
          heading,
        } = position.coords;

       console.warn("LAT:", latitude);
console.warn("LNG:", longitude);

setGpsPos([
  latitude,
  longitude,
]);

        console.warn(
        "LIVE GPS",
        latitude,
        longitude
        );

        setAccuracy(
          accuracy ?? null
        );

        if (
          heading !== null &&
          !Number.isNaN(heading)
        ) {
          setHeading(heading);
        }

        setError(null);
      },

      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Location permission denied");
            break;

          case err.POSITION_UNAVAILABLE:
            setError("Location unavailable");
            break;

          case err.TIMEOUT:
            setError("Location request timed out");
            break;

          default:
            setError("Unknown location error");
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [enabled]);

  return {
    gpsPos,
    heading,
    accuracy,
    error,
  };
}