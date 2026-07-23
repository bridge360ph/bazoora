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
  const [isCollecting] = useState(true);

 const {
  gpsPos,
  heading,
} = useDriverGPS();


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

      case "messages":
        void navigate("/driver/messages");
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
                // TODO: Complete route action
              }}
              onReportIssue={() =>
                void navigate("/driver/report")
              }
            />
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

      {confirmOpen && (
        <LogoutConfirmModal
          onCancel={() =>
            setConfirmOpen(false)
          }
          onConfirm={handleLogout}
        />
      )}
    </div>
  );
}

export default CurrentRoute;