import { useEffect, useState } from "react";

export function useLocationPermission() {
  const [
    locationExplanationOpen,
    setLocationExplanationOpen,
  ] = useState(true);

  const [
    locationPermissionOpen,
    setLocationPermissionOpen,
  ] = useState(false);

  const [
    locationPermissionGranted,
    setLocationPermissionGranted,
  ] = useState(false);

  useEffect(() => {
    const checkLocationPermission = async () => {
      if (!("permissions" in navigator)) {
        return;
      }

      try {
        const permission =
          await navigator.permissions.query({
            name: "geolocation",
          });

        if (permission.state === "granted") {
          setLocationPermissionGranted(true);
          setLocationExplanationOpen(false);
          setLocationPermissionOpen(false);
        }

        permission.onchange = () => {
          if (permission.state === "granted") {
            setLocationPermissionGranted(true);
            setLocationExplanationOpen(false);
            setLocationPermissionOpen(false);
          } else {
            setLocationPermissionGranted(false);
          }
        };
      } catch (error) {
        console.error(
          "Failed to check location permission:",
          error,
        );
      }
    };

    void checkLocationPermission();
  }, []);

  const requestLocationPermission = () => {
    if (!navigator.geolocation) {
      alert(
        "Geolocation is not supported by this browser.",
      );

      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationPermissionGranted(true);
        setLocationPermissionOpen(false);
        setLocationExplanationOpen(false);
      },

      (error) => {
        console.error(
          "Location error:",
          error,
        );

        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert(
              "Location permission was denied. Please enable it in your browser settings.",
            );
            break;

          case error.POSITION_UNAVAILABLE:
            alert(
              "Unable to get your location. Check your GPS/network.",
            );
            break;

          case error.TIMEOUT:
            alert(
              "Location request timed out. Try again.",
            );
            break;

          default:
            alert(
              "Unknown location error.",
            );
        }

        setLocationPermissionGranted(false);
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  return {
    locationExplanationOpen,
    setLocationExplanationOpen,

    locationPermissionOpen,
    setLocationPermissionOpen,

    locationPermissionGranted,

    requestLocationPermission,
  };
}

