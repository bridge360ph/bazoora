import { useState } from "react";

import { useNavigate } from "react-router-dom";

import { useAuthStore } from "@/stores/auth-store";
import { env } from "@/lib/env";
import { getDistanceInMeters } from "@/lib/location";

import { Sidebar } from "./shared/Sidebar";
import { Header } from "./shared/Header";
import type { SettingsTab } from "./shared/Header";
import { BottomNav } from "./shared/BottomNav";
import { Fab } from "./shared/Fab";
import { useIsMobile } from "./shared/useIsMobile";
import {
  layout,
  mainWrap,
} from "./shared/layoutStyles";

import RouteMapSection from "./current-route/components/RouteMapSection";
import AssignedTasksPanel from "./current-route/components/AssignedTasksPanel";
import DestinationCard from "./current-route/components/DestinationCard";
import RouteOverviewCard from "./current-route/components/RouteOverviewCard";
import DriverRouteModals from "./current-route/components/DriverRouteModals";

import { useDriverGPS } from "./hooks/useDriverGPS";

import {
  useAssignedDriverRoute,
} from "./current-route/hooks/useAssignedDriverRoute";

import {
  useDriverLocationSync,
} from "./current-route/hooks/useDriverLocationSync";

import {
  useLocationPermission,
} from "./current-route/hooks/useLocationPermission";

export function CurrentRoute() {
  const navigate =
    useNavigate();

  const clearSession =
    useAuthStore(
      (state) => state.clear,
    );

  const accessToken =
    useAuthStore(
      (state) =>
        state.accessToken,
    );

  const isMobile =
    useIsMobile();

  const [navOpen, setNavOpen] =
    useState(false);

  const [
    confirmOpen,
    setConfirmOpen,
  ] = useState(false);

  const [
    startRouteConfirmOpen,
    setStartRouteConfirmOpen,
  ] = useState(false);

  const [
    tooFarModalOpen,
    setTooFarModalOpen,
  ] = useState(false);

  const [
    distanceRemaining,
    setDistanceRemaining,
  ] = useState(0);

  const [
    isCollecting,
    setIsCollecting,
  ] = useState(
    () =>
      localStorage.getItem(
        "driverRouteStarted",
      ) === "true",
  );

  const {
    locationExplanationOpen,
    setLocationExplanationOpen,
    locationPermissionOpen,
    setLocationPermissionOpen,
    locationPermissionGranted,
    requestLocationPermission,
  } =
    useLocationPermission();

  const {
    truckId,
    assignedRoute,
    stops,
  } =
    useAssignedDriverRoute(
      accessToken,
    );

  const {
    gpsPos,
    heading,
  } = useDriverGPS({
    enabled: isCollecting,
  });

  useDriverLocationSync({
    isCollecting,
    gpsPos,
    truckId,
    accessToken,
  });

  const routePath: [
    number,
    number,
  ][] = [];

  const goTo = (
    key: string,
  ) => {
    setNavOpen(false);

    switch (key) {
      case "dashboard":
        void navigate(
          "/driver",
        );
        break;

      case "route":
        void navigate(
          "/driver/route",
        );
        break;

      case "collections":
        void navigate(
          "/driver/collections",
        );
        break;

      case "report":
        void navigate(
          "/driver/report",
        );
        break;

      default:
        break;
    }
  };

  const goToSettingsTab = (
    tab: SettingsTab,
  ) => {
    void navigate(
      `/driver/settings?tab=${tab}`,
    );
  };

  const handleLogout =
    () => {
      clearSession();
      void navigate(
        "/login",
      );
    };

  const handleStartRoute =
    () => {
      setStartRouteConfirmOpen(
        true,
      );
    };

  const confirmStartRoute =
    async () => {
      if (!truckId) {
        console.error(
          "Cannot start route: no assigned truck.",
        );
        return;
      }

      try {
        const response =
          await fetch(
            `${env.VITE_API_URL}/trucks/${truckId}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${accessToken}`,
              },
              body: JSON.stringify(
                {
                  status:
                    "Active",
                },
              ),
            },
          );

        const json =
          await response.json();

        if (
          !response.ok ||
          !json.success
        ) {
          console.error(
            "Failed to start route:",
            json,
          );
          return;
        }

        setStartRouteConfirmOpen(
          false,
        );

        setIsCollecting(
          true,
        );

        localStorage.setItem(
          "driverRouteStarted",
          "true",
        );
      } catch (error) {
        console.error(
          "Failed to start route:",
          error,
        );
      }
    };

  const activeStop =
    stops.find(
      (stop) =>
        stop.status ===
        "NOW",
    ) ?? null;

  const handleComplete =
    () => {
      if (!gpsPos) {
        console.warn(
          "No GPS position available.",
        );
        return;
      }

      if (!activeStop) {
        console.warn(
          "No active stop found.",
        );
        return;
      }

      const distance =
        getDistanceInMeters(
          gpsPos[0],
          gpsPos[1],
          activeStop.lat,
          activeStop.lng,
        );

      if (distance > 50) {
        setDistanceRemaining(
          Math.round(
            distance,
          ),
        );

        setTooFarModalOpen(
          true,
        );

        return;
      }

      /*
       * Stop completion will be
       * connected to the database
       * in the next step.
       */
    };

  return (
    <div
      className={layout}
    >
      <Sidebar
        activeKey="route"
        isMobile={isMobile}
        navOpen={navOpen}
        onNavigate={goTo}
        onClose={() =>
          setNavOpen(
            false,
          )
        }
      />

      <div
        className={mainWrap}
      >
        <Header
          isMobile={isMobile}
          title="Route & Assigned Tasks"
          onToggleNav={() =>
            setNavOpen(
              (value) =>
                !value,
            )
          }
          onSelectSettingsTab={
            goToSettingsTab
          }
          onLogout={() =>
            setConfirmOpen(
              true,
            )
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
                : "grid items-start gap-4"
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
            <div className="flex min-w-0 flex-col gap-4">
              <RouteMapSection
                gpsPos={gpsPos}
                heading={heading}
                stops={stops}
                isPlanning={false}
                isCollecting={
                  isCollecting
                }
                routePath={
                  routePath
                }
                locationPermissionGranted={
                  locationPermissionGranted
                }
                onMarkComplete={
                  handleComplete
                }
                onReportIssue={() =>
                  void navigate(
                    "/driver/report",
                  )
                }
              />

              <div
                className={
                  isMobile
                    ? "flex flex-col gap-3"
                    : "grid grid-cols-2 gap-4"
                }
              >
                <RouteOverviewCard
                  stops={stops}
                  gpsPos={gpsPos}
                />

                <DestinationCard
                  stop={
                    activeStop
                  }
                />
              </div>
            </div>

            {/* RIGHT SIDE */}
            <AssignedTasksPanel
              stops={stops}
              assignedRoute={
                assignedRoute
              }
              onDashboard={() => {
                void navigate(
                  "/driver",
                );
              }}
            />

            {locationPermissionGranted &&
              !isCollecting && (
                <button
                  type="button"
                  onClick={
                    handleStartRoute
                  }
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

      <DriverRouteModals
        locationExplanationOpen={
          locationExplanationOpen
        }
        locationPermissionOpen={
          locationPermissionOpen
        }
        startRouteConfirmOpen={
          startRouteConfirmOpen
        }
        confirmOpen={
          confirmOpen
        }
        tooFarModalOpen={
          tooFarModalOpen
        }
        distanceRemaining={
          distanceRemaining
        }
        onLocationExplanationContinue={() => {
          setLocationExplanationOpen(
            false,
          );

          setLocationPermissionOpen(
            true,
          );
        }}
        onRequestLocation={
          requestLocationPermission
        }
        onStartRouteCancel={() =>
          setStartRouteConfirmOpen(
            false,
          )
        }
        onStartRouteConfirm={
          confirmStartRoute
        }
        onLogoutCancel={() =>
          setConfirmOpen(
            false,
          )
        }
        onLogoutConfirm={
          handleLogout
        }
        onTooFarClose={() =>
          setTooFarModalOpen(
            false,
          )
        }
      />
    </div>
  );
}

export default CurrentRoute;
