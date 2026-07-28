"use client";

import { useEffect, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@bazoora/ui";
import { toast } from "sonner";

interface LocationPermissionProps {
  onAllow?: () => void;
}

export function LocationPermissionModal({
  onAllow,
}: LocationPermissionProps = {}) {
  const [show, setShow] = useState(false);
  const [isDenied, setIsDenied] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      queueMicrotask(() => {
        setShow(true);
        setIsDenied(true);
      });
      return;
    }

    if (!navigator.permissions) {
        queueMicrotask(() => {
          setShow(true);
        });
        return;
      }

    navigator.permissions
      .query({ name: "geolocation" })
      .then((permission) => {
        if (permission.state === "granted") {
          setShow(false);
          onAllow?.();
          return;
        }

        if (permission.state === "denied") {
          setIsDenied(true);
        } else {
          setIsDenied(false);
        }

        setShow(true);

        permission.onchange = () => {
          if (permission.state === "granted") {
            setIsDenied(false);
            setShow(false);
            onAllow?.();
          } else if (permission.state === "denied") {
            setIsDenied(true);
            setShow(true);
          }
        };
      })
      .catch(() => {
        setShow(true);
      });
  }, [onAllow]);

  const handleAllow = () => {
    if (!navigator.geolocation) {
      setIsDenied(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setIsDenied(false);
        setShow(false);
        onAllow?.();
        toast.success("Location enabled successfully!");
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setIsDenied(true);
          setShow(true);

          toast.error("Location permission denied", {
            description:
              "Please allow location access in your browser settings.",
          });
        } else {
          toast.error("Unable to access your location", {
            description:
              "Please make sure your device location is turned on.",
          });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl text-center">
        {isDenied ? (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
              <MapPin className="h-10 w-10 text-red-500" />
            </div>

            <h2 className="mb-2 text-2xl font-black text-gray-900">
              Location Access Blocked
            </h2>

            <p className="mb-6 text-sm text-gray-500 leading-relaxed">
              Bazoora needs your location to provide accurate routing and
              real-time tracking during waste collection.
            </p>

            <div className="rounded-2xl bg-gray-50 p-4 mb-6 text-left text-xs text-gray-500 border border-gray-100">
              <p className="font-bold text-gray-700 mb-1">
                Location is currently blocked.
              </p>

              <p>
                Please enable Location for Bazoora in your browser settings,
                then return to the app.
              </p>
            </div>

            <Button
              onClick={handleAllow}
              className="h-14 w-full rounded-2xl bg-gray-900 text-sm font-bold text-white"
            >
              Check Location Permission
            </Button>
          </>
        ) : (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
              <MapPin className="h-10 w-10 text-blue-600" />
            </div>

            <h2 className="mb-2 text-2xl font-black text-gray-900">
              Enable Location
            </h2>

            <p className="mb-8 text-sm text-gray-500 leading-relaxed">
              Bazoora needs your location to provide accurate directions,
              estimate your arrival time, and track your route while you are
              driving.
            </p>

            <Button
              onClick={handleAllow}
              className="h-14 w-full rounded-2xl bg-blue-600 text-sm font-bold text-white"
            >
              <Navigation className="mr-2 h-5 w-5" />
              Allow Location
            </Button>
          </>
        )}
      </div>
    </div>
  );
}