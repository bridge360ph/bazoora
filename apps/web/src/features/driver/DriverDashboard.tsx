import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";

import { Icon } from "./shared/icons";
import { icons } from "./shared/iconData";
import { Sidebar } from "./shared/Sidebar";
import { Header } from "./shared/Header";
import type { SettingsTab } from "./shared/Header";
import { BottomNav } from "./shared/BottomNav";
import { Fab } from "./shared/Fab";
import { useIsMobile } from "./shared/useIsMobile";

import {
  layout,
  mainWrap,
  topCards,
  topCardsMobile,
  smallCard,
  smallCardRow,
  smallLabel,
  smallValue,
  pillOrangeSmall,
  pillGreenSmall,
} from "./shared/layoutStyles";

import { useDriverDashboardData } from "./hooks/useDriverDashboardData";
import DashboardStopItem from "./components/DashboardStopItem";
import DriverLogoutConfirmModal from "./components/DriverLogoutConfirmModal";

function DriverDashboard() {
  const navigate = useNavigate();
  const clearSession = useAuthStore((state) => state.clear);
  const isMobile = useIsMobile();

  const [navOpen, setNavOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    assignedRoute,
    stops,
    truck,
    truckLoading,
    gpsActive,
    taskToShow,
    hasActiveTask,
    totalStops,
    completedCount,
    remainingCount,
    progress,
  } = useDriverDashboardData();

  const goTo = (key: string) => {
    setNavOpen(false);

    const routes: Record<string, string> = {
      dashboard: "/driver",
      route: "/driver/route",
      collections: "/driver/collections",
      report: "/driver/report",
      settings: "/driver/settings",
    };

    const path = routes[key];

    if (path) {
      void navigate(path);
    }
  };

  const goToSettingsTab = (tab: SettingsTab) => {
    void navigate(`/driver/settings?tab=${tab}`);
  };

  const handleLogout = () => {
    clearSession();
    void navigate("/login");
  };

  const routeNumber = assignedRoute
    ? String(assignedRoute.routeNumber).padStart(3, "0")
    : null;

  const taskLabel = hasActiveTask
    ? "CURRENT STOP"
    : "NEXT TASK";

  const taskStatus = hasActiveTask
    ? "IN PROGRESS"
    : "UP NEXT";

  return (
    <div className={layout}>
      <Sidebar
        activeKey="dashboard"
        isMobile={isMobile}
        navOpen={navOpen}
        onNavigate={goTo}
        onClose={() => setNavOpen(false)}
      />

      <div className={mainWrap}>
        <Header
          isMobile={isMobile}
          title="Dashboard"
          onToggleNav={() => setNavOpen((value) => !value)}
          onSelectSettingsTab={goToSettingsTab}
          onLogout={() => setConfirmOpen(true)}
        />

        <main className={isMobile ? "p-3.5 pb-24" : "p-[18px]"}>
          <div className={isMobile ? topCardsMobile : topCards}>
            <div className={`${smallCard} ${isMobile ? "col-span-2" : ""}`}>
              <div className={smallLabel}>Today's Route</div>

              <div className={smallValue}>
                {routeNumber ? `Route ${routeNumber}` : "No Route"}
              </div>

              {assignedRoute && (
                <div className="mt-1 truncate text-xs text-gray-500">
                  {assignedRoute.name}
                </div>
              )}
            </div>

            <div className={`${smallCardRow} ${isMobile ? "flex-col items-start gap-2" : ""}`}>
              <div className="min-w-0">
                <div className={smallLabel}>Stops Completed</div>
                <div className={smallValue}>
                  {completedCount}/{totalStops}
                </div>
              </div>

              <div className={pillOrangeSmall}>
                {hasActiveTask
                  ? "IN PROGRESS"
                  : totalStops > 0
                    ? "READY"
                    : "NO TASKS"}
              </div>
            </div>

            <div className={`${smallCardRow} ${isMobile ? "flex-col items-start gap-2" : ""}`}>
              <div className="min-w-0">
                <div className={smallLabel}>Assigned Truck</div>

                <div className={smallValue}>
                  {truckLoading
                    ? "Loading..."
                    : truck?.plateNumber || "No Truck"}
                </div>
              </div>

              <div
                className={
                  gpsActive
                    ? pillGreenSmall
                    : "rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600"
                }
              >
                {gpsActive
                  ? "ACTIVE • GPS ON"
                  : truck
                    ? "GPS OFF"
                    : "NO TRUCK"}
              </div>
            </div>
          </div>

          <div className={isMobile ? "flex flex-col gap-4" : "grid grid-cols-2 gap-4"}>
            <div
              className="flex flex-col justify-between gap-4 rounded-2xl bg-[#003d1f] px-[22px] py-[18px] text-white"
              style={{ minHeight: isMobile ? "auto" : 260 }}
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[13px] opacity-80">{taskLabel}</div>

                  <div className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-bold text-orange-800">
                    {taskStatus}
                  </div>
                </div>

                {taskToShow ? (
                  <>
                    <div className="text-[22px] font-extrabold leading-tight">
                      {taskToShow.name} — Stop {taskToShow.stopNumber}
                    </div>

                    <div className="text-[13px] leading-relaxed opacity-85">
                      {taskToShow.address} • {taskToShow.barangay} •{" "}
                      {taskToShow.wasteType}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[22px] font-extrabold leading-tight">
                      No collection task
                    </div>

                    <div className="text-[13px] leading-relaxed opacity-85">
                      There are no active or upcoming collection stops on
                      this route.
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => void navigate("/driver/route")}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-green-400 px-4 py-3.5 text-sm font-bold text-slate-900"
                >
                  <Icon icon={icons.check} />
                  View Route
                </button>

                {taskToShow && (
                  <button
                    type="button"
                    onClick={() => void navigate("/driver/report")}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3.5 text-sm font-bold text-white"
                  >
                    <Icon icon={icons.document} />
                    Report Issue
                  </button>
                )}
              </div>
            </div>

            <div
              className="flex flex-col overflow-hidden rounded-[18px] border border-gray-200 bg-white"
              style={{ minHeight: isMobile ? "auto" : 260 }}
            >
              <div className="border-b border-gray-100 px-[18px] pb-3 pt-[18px]">
                <button
                  type="button"
                  onClick={() => void navigate("/driver/route")}
                  className="mb-3 cursor-pointer text-lg font-bold"
                >
                  Route Progress
                </button>

                <div className="h-2.5 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-blue-900 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mt-2 flex justify-between text-[13px]">
                  <span>{completedCount} Completed</span>
                  <span>{remainingCount} Remaining</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-[18px]">
                {stops.length > 0 ? (
                  stops.map((stop) => (
                    <DashboardStopItem
                      key={stop.stopNumber}
                      stop={stop}
                      onDetails={() =>
                        void navigate("/driver/route")
                      }
                    />
                  ))
                ) : (
                  <div className="py-8 text-center text-sm text-gray-500">
                    No collection stops are currently assigned.
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {isMobile && (
        <BottomNav
          activeKey="dashboard"
          onNavigate={goTo}
        />
      )}

      {isMobile && <Fab onNavigate={goTo} />}

      {confirmOpen && (
        <DriverLogoutConfirmModal
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleLogout}
        />
      )}
    </div>
  );
}

export default DriverDashboard;

