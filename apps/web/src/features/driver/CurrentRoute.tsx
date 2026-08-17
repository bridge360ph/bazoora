import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "@/stores/auth-store";

import { Sidebar } from "./shared/Sidebar";
import { Header } from "./shared/Header";
import type { SettingsTab } from "./shared/Header";
import { BottomNav } from "./shared/BottomNav";
import { Fab } from "./shared/Fab";
import { useIsMobile } from "./shared/useIsMobile";
import { layout, mainWrap } from "./shared/layoutStyles";

import RouteMapSection from "./current-route/components/RouteMapSection";
import AssignedTasksPanel from "./current-route/components/AssignedTasksPanel";
import DestinationCard from "./current-route/components/DestinationCard";
import RouteOverviewCard from "./current-route/components/RouteOverviewCard";

import { useDriverGPS } from "./hooks/useDriverGPS";

import { getDistanceInMeters } from "@/lib/location";

function LogoutConfirmModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4">
        <div>
          <div className="text-base font-bold text-slate-900">
            Log Out?
          </div>

          <div className="text-xs opacity-55">
            You'll need to sign in again to access your route.
          </div>
        </div>

        <div className="flex gap-2.5">
          <button
            className="flex-1 bg-white border border-gray-200 text-slate-700 rounded-xl py-2.5 font-bold text-sm"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            className="flex-1 bg-red-600 text-white rounded-xl py-2.5 font-bold text-sm"
            onClick={onConfirm}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

type Stop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "pending" | "active" | "completed";
};

export function CurrentRoute() {
  const navigate = useNavigate();

  const clearSession = useAuthStore(
    (state) => state.clear
  );

  const isMobile = useIsMobile();

const [navOpen, setNavOpen] = useState(false);
const [confirmOpen, setConfirmOpen] = useState(false);
const [startRouteConfirmOpen, setStartRouteConfirmOpen] = useState(false);

const [locationExplanationOpen, setLocationExplanationOpen] =
  useState(true);

const [locationPermissionOpen, setLocationPermissionOpen] =
  useState(false);

const [locationPermissionGranted, setLocationPermissionGranted] =
  useState(false);

  const [stops] = useState<Stop[]>([
    {
      id: "1",
      name: "Collection Point 1",
      lat: 14.3845,
      lng: 120.8850,
      status: "active",
    },
    {
      id: "2",
      name: "Collection Point 2",
      lat: 14.386,
      lng: 120.887,
      status: "pending",
    },
  ]);

const [isPlanning] = useState(false);
const [isCollecting, setIsCollecting] = useState(false);

const {
  gpsPos,
  heading,
} = useDriverGPS({
  enabled: isCollecting,
});


  const routePath: [number, number][] = [];

  const goTo = (key: string) => {
    setNavOpen(false);

    switch (key) {
      case "dashboard":
        void navigate("/driver");
        break;

      case "route":
        void navigate("/driver/route");
        break;

      case "collections":
        void navigate("/driver/collections");
        break;

      case "report":
        void navigate("/driver/report");
        break;

      default:
        break;
    }
  };

  const goToSettingsTab = (
    tab: SettingsTab
  ) => {
    void navigate(`/driver/settings?tab=${tab}`);
  };

  const handleLogout = () => {
    clearSession();
    void navigate("/login");
  };

  const handleStartRoute = () => {
    setStartRouteConfirmOpen(true);
  };

    const confirmStartRoute = () => {
      setStartRouteConfirmOpen(false);
      setIsCollecting(true);
    };

  const requestLocationPermission = () => {
  if (!navigator.geolocation) {
    return;
  }

  navigator.geolocation.getCurrentPosition(
    () => {
      setLocationPermissionGranted(true);
      setLocationPermissionOpen(false);
    },
    () => {
      setLocationPermissionGranted(false);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
};

  return (
    <div className={layout}>
      <Sidebar
        activeKey="route"
        isMobile={isMobile}
        navOpen={navOpen}
        onNavigate={goTo}
        onClose={() => setNavOpen(false)}
      />

      <div className={mainWrap}>
        <Header
          isMobile={isMobile}
          title="Route & Assigned Tasks"
          onToggleNav={() =>
            setNavOpen((v) => !v)
          }
          onSelectSettingsTab={goToSettingsTab}
          onLogout={() =>
            setConfirmOpen(true)
          }
        />

        <main
          className={
            isMobile
              ? "p-3.5 pb-24"
              : "p-[18px]"
          }
        >
          <div
            className={
              isMobile
                ? "flex flex-col gap-4"
                : "grid gap-4 items-start"
            }
            style={
              !isMobile
                ? {
                    gridTemplateColumns:
                      "1fr 340px",
                  }
                : undefined
            }
          >
            {/* LEFT SIDE */}

            <div className="flex flex-col gap-4 min-w-0">
              <RouteMapSection
                gpsPos={gpsPos}
                heading={heading}
                stops={stops}
                isPlanning={isPlanning}
                isCollecting={isCollecting}
                routePath={routePath}
                locationPermissionGranted={locationPermissionGranted}
              />

              <div
                className={
                  isMobile
                    ? "flex flex-col gap-3"
                    : "grid grid-cols-2 gap-4"
                }
              >
                <RouteOverviewCard />

                <DestinationCard />
              </div>
            </div>

            {/* RIGHT SIDE */}

            <AssignedTasksPanel
              onDashboard={() => {
                void navigate("/driver");
              }}
              onComplete={() => {
  if (!gpsPos) {
    console.warn("No GPS position available.");
    return;
  }

  const activeStop = stops.find(
    (stop) => stop.status === "active"
  );

  if (!activeStop) {
    console.warn("No active stop found.");
    return;
  }

  const distance = getDistanceInMeters(
    gpsPos[0], // latitude ✅
    gpsPos[1], // longitude ✅
    activeStop.lat,
    activeStop.lng
  );

  console.log("GPS position:", {
    latitude: gpsPos[0],
    longitude: gpsPos[1],
  });

  console.log("Active stop:", {
    latitude: activeStop.lat,
    longitude: activeStop.lng,
  });

  console.log("Distance to stop:", distance, "meters");

  if (distance > 50) {
    setDistanceRemaining(Math.round(distance));
    setTooFarModalOpen(true);
    return;
  }

  // Driver is close enough
  console.log("Stop completed!");
}}
              onReportIssue={() =>
                void navigate("/driver/report")
              }
            />

            {locationPermissionGranted && !isCollecting && (
             <button
                type="button"
                onClick={handleStartRoute}
                className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-emerald-700"
              >
                Start Route
              </button>
            )}
          </div>
        </main>
      </div>

            {isMobile && (
        <BottomNav
          activeKey="route"
          onNavigate={goTo}
        />
      )}

      {isMobile && (
        <Fab
          onNavigate={goTo}
        />
      )}

      {locationExplanationOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">
              Location Access
            </h2>

            <p className="mt-3 text-sm leading-5 text-slate-500">
              Bazoora needs access to your location while you are using
              the driver route feature. Your location helps the app show
              your position on the route map and provide accurate route
              tracking.
            </p>

            <p className="mt-3 text-sm leading-5 text-slate-500">
              Please understand that location access is required before
              you can view and use the route map.
            </p>

            <button
              type="button"
              onClick={() => {
                setLocationExplanationOpen(false);
                setLocationPermissionOpen(true);
              }}
              className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {locationPermissionOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">
              Allow Location Access
            </h2>

            <p className="mt-3 text-sm leading-5 text-slate-500">
              Allow Bazoora to access your location so your position can
              be displayed on the route map.
            </p>

            <button
              type="button"
              onClick={requestLocationPermission}
              className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700"
            >
              Allow Location Access
            </button>
          </div>
        </div>
      )}

    {startRouteConfirmOpen && (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-bold text-slate-900">
            Start Route?
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Starting the route will enable GPS tracking and allow Bazoora
            to provide your route directions and estimated arrival time.
          </p>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setStartRouteConfirmOpen(false)}
              className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-slate-700"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={confirmStartRoute}
              className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white"
            >
              Start Route
            </button>
          </div>
        </div>
      </div>
    )}

      {confirmOpen && (
        <LogoutConfirmModal
          onCancel={() =>
            setConfirmOpen(false)
          }
          onConfirm={handleLogout}
        />
      )}

      {tooFarModalOpen && (
  <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4">
    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
      <h2 className="text-lg font-bold">
        You're not at the collection point
      </h2>

      <p className="mt-3 text-sm text-slate-500">
        Move closer before marking this stop as complete.
      </p>

      <p className="mt-2 text-sm font-medium">
        Distance remaining: {distanceRemaining} m
      </p>

      <button
        className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-white"
        onClick={() => setTooFarModalOpen(false)}
      >
        OK
      </button>
    </div>
  </div>
)}
    </div>
  );
}

export default CurrentRoute;