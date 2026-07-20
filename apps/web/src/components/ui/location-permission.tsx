"use client";
import { useState, useEffect } from "react";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@bazoora/ui";
import { toast } from "sonner";

interface LocationPermissionProps {
  onAllow?: () => void;
}

export function LocationPermissionModal({ onAllow }: LocationPermissionProps = {}) {
  const [show, setShow] = useState(false);
  const [isDenied, setIsDenied] = useState(false);

  const handleRetry = () => {
    if (!navigator.geolocation) return;
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Location successfully enabled live:", position.coords);
        setIsDenied(false);
        setShow(false);
        if (onAllow) onAllow();
        toast.success("Location enabled successfully!");
      },
      (error) => {
        console.warn("Retry failed. Location still blocked:", error);
        toast.error("Location still blocked", {
          description: "Please make sure you have allowed location access in your browser settings.",
        });
      }
    );
  };

  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) return;

    const triggerNativePrompt = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Automatic location check succeeded:", position.coords);
          setShow(false);
          if (onAllow) onAllow();
        },
        (error) => {
          console.warn("Automatic location check failed/denied:", error);
          // Don't close modal if they block it, so they see the instructions
        }
      );
    };

    // Check permissions API if available
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        console.log("Location permission state:", result.state);
        if (result.state === "prompt") {
          setShow(true);
          triggerNativePrompt(); // Automatically trigger native prompt!
        } else if (result.state === "granted") {
          // If already granted, just proceed
          if (onAllow) onAllow();
        } else {
          // If denied, show the instruction modal to let them know they must unblock it
          setIsDenied(true);
          setShow(true);
        }

        // Listen for changes
        result.onchange = () => {
          if (result.state === "granted") {
            setIsDenied(false);
            setShow(false);
            if (onAllow) onAllow();
          } else if (result.state === "denied") {
            setIsDenied(true);
            setShow(true);
          }
        };
      }).catch((err) => {
        console.error("Permissions query failed:", err);
        setShow(true);
        triggerNativePrompt();
      });
    } else {
      // Fallback for browsers without permissions API
      console.log("Permissions API not supported, showing modal by default");
      setShow(true);
      triggerNativePrompt();
    }
  }, [onAllow]);

  const handleAllow = () => {
    setShow(false);
    if (onAllow) {
      onAllow();
    } else {
      // Trigger native browser prompt
      navigator.geolocation.getCurrentPosition(
        () => {},
        () => {}
      );
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200">
        {isDenied ? (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
              <MapPin className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="mb-2 text-2xl font-black text-gray-900">Location Access Blocked</h2>
            <p className="mb-6 text-sm text-gray-500 leading-relaxed">
              You have blocked location access for Bazoora. Because location tracking is required for this portal to function, please enable it in your browser settings.
            </p>
            <div className="rounded-2xl bg-gray-50 p-4 mb-6 text-left text-xs text-gray-500 border border-gray-100">
              <p className="font-bold text-gray-700 mb-1">How to unblock:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click the lock or settings icon (🔒) on the left side of your browser URL bar.</li>
                <li>Toggle the <strong>Location</strong> setting to <strong>Allow</strong>.</li>
                <li>Refresh the page to apply the changes.</li>
              </ol>
            </div>
            <Button 
              onClick={handleRetry} 
              className="h-14 w-full rounded-2xl bg-gray-900 text-sm font-bold text-white shadow-lg hover:bg-gray-800 transition"
            >
              Accept Permission
            </Button>
          </>
        ) : (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
              <MapPin className="h-10 w-10 text-blue-600 animate-bounce" />
            </div>
            <h2 className="mb-2 text-2xl font-black text-gray-900">Enable Location</h2>
            <p className="mb-8 text-sm text-gray-500">
              Bazoora needs your location to provide accurate routing and real-time tracking for waste collection.
            </p>
            
            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleAllow} 
                className="h-14 w-full rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-lg hover:bg-blue-700 transition"
              >
                <Navigation className="mr-2 h-5 w-5" />
                Turn On Location
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleAllow} // Still proceed so app doesn't hang (it will fallback to demo coords)
                className="h-12 w-full rounded-2xl text-sm font-bold text-gray-400 hover:bg-gray-50"
              >
                Maybe Later
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
