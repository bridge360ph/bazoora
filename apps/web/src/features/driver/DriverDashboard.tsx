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

/* ---------------- DATA ---------------- */

const routeStops = [
  {
    name: "Sitio Malakas, Brgy. San Rafael",
    date: "OCT 24, 2023 • 14:22",
    subtitle: "12 households • Residential Area",
    status: "COMPLETED",
  },
  {
    name: "Purok 7, Brgy. San Rafael",
    date: "OCT 24, 2023 • 14:22",
    subtitle: "Industrial Park • Warehouse A",
    status: "REPORTED",
  },
  {
    name: "Purok 12, Brgy. Mangahan",
    date: "OCT 24, 2023 • 14:22",
    subtitle: "8 households • Commercial Strip",
    status: "PENDING",
  },
  {
    name: "Sitio Pag-asa, Brgy. Biela",
    date: "OCT 24, 2023 • 14:22",
    subtitle: "20 households • Village Block",
    status: "PENDING",
  },
];

const stripColor: Record<string, string> = {
  COMPLETED: "bg-green-500",
  REPORTED: "bg-red-500",
  PENDING: "bg-amber-500",
};

const pillClass: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-800",
  REPORTED: "bg-red-100 text-red-800",
  PENDING: "bg-orange-100 text-orange-800",
};

/* ---------------- LOG OUT CONFIRMATION MODAL ---------------- */
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
            <Icon icon={icons.logout} size={18} />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900">Log Out?</div>
            <div className="text-xs opacity-55">You'll need to sign in again to access your route.</div>
          </div>
        </div>

        <div className="flex gap-2.5">
          <button
            className="flex-1 bg-white border border-gray-200 text-slate-700 rounded-xl py-2.5 font-bold text-sm cursor-pointer"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="flex-1 bg-red-600 text-white rounded-xl py-2.5 font-bold text-sm cursor-pointer"
            onClick={onConfirm}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- COMPONENT ---------------- */

function DriverDashboard() {
  const navigate = useNavigate();
  const clearSession = useAuthStore((s) => s.clear);

  const completed = 8;
  const total = 14;
  const progress = (completed / total) * 100;

  const activeKey = "dashboard";
  const activeMobileKey = "dashboard";

  const isMobile = useIsMobile();
  const [navOpen, setNavOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const goTo = (key: string) => {
    setNavOpen(false);

    switch (key) {
      case "route":
        void navigate("/driver/route");
        break;

      case "collections":
        void navigate("/driver/collections");
        break;

      case "report":
        void navigate("/driver/report");
        break;

      case "settings":
        void navigate("/driver/settings");
        break;

      case "dashboard":
        void navigate("/driver");
        break;

      default:
        break;
    }
  };

  // Sends the avatar dropdown straight to a specific Settings tab, so
  // Account/Notifications/System all land on the right tab instead of
  // just opening Settings on its default tab.
  const goToSettingsTab = (tab: SettingsTab) => {
    void navigate(`/driver/settings?tab=${tab}`);
  };

  // Logout requires confirmation first — Header's menu just opens the
  // modal; the modal's own "Log Out" button calls this to actually clear
  // the session and redirect.
  const handleLogout = () => {
    clearSession();
    void navigate("/login");
  };

  return (
    <div className={layout}>
      <Sidebar
        activeKey={activeKey}
        isMobile={isMobile}
        navOpen={navOpen}
        onNavigate={goTo}
        onClose={() => setNavOpen(false)}
      />

      <div className={mainWrap}>
        <Header
          isMobile={isMobile}
          title="Dashboard"
          onToggleNav={() => setNavOpen((v) => !v)}
          onSelectSettingsTab={goToSettingsTab}
          onLogout={() => setConfirmOpen(true)}
        />

        <main className={isMobile ? "p-3.5 pb-24" : "p-[18px]"}>
          <div className={isMobile ? topCardsMobile : topCards}>
            <div className={`${smallCard} ${isMobile ? "col-span-2" : ""}`}>
              <div className={smallLabel}>Today's Route</div>
              <div className={smallValue}>Route 1</div>
            </div>

            <div
              className={`${smallCardRow} ${
                isMobile ? "flex-col items-start gap-2" : ""
              }`}
            >
              <div className="min-w-0">
                <div className={smallLabel}>Stops Completed</div>
                <div className={smallValue}>
                  {completed}/{total}
                </div>
              </div>

              <div className={pillOrangeSmall}>IN PROGRESS</div>
            </div>

            <div
              className={`${smallCardRow} ${
                isMobile ? "flex-col items-start gap-2" : ""
              }`}
            >
              <div className="min-w-0">
                <div className={smallLabel}>Assigned Truck</div>
                <div className={smallValue}>BT-04</div>
              </div>

              <div className={pillGreenSmall}>ACTIVE • GPS ON</div>
            </div>
          </div>

          <div
            className={
              isMobile ? "flex flex-col gap-4" : "grid grid-cols-2 gap-4"
            }
          >
            {/* CURRENT STOP */}

            <div
              className="bg-[#003d1f] text-white rounded-2xl px-[22px] py-[18px] flex flex-col justify-between gap-4"
              style={{ height: isMobile ? "auto" : 260 }}
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center">
                  <div className="text-[13px] opacity-80">
                    CURRENT STOP
                  </div>

                  <div className="bg-orange-100 text-orange-800 px-3 py-1.5 rounded-full text-xs font-bold">
                    IN PROGRESS
                  </div>
                </div>

                <div className="text-[22px] font-extrabold leading-tight">
                  Sitio Malaya — Stop 9
                </div>

                <div className="opacity-85 text-[13px] leading-relaxed">
                  Purok 3, Barangay Poblacion • Biodegradable
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <button className="bg-green-400 px-4 py-3.5 rounded-xl font-bold text-sm cursor-pointer flex items-center justify-center gap-2">
                  <Icon icon={icons.check} />
                  Mark as Complete
                </button>

                <button
                  className="bg-red-600 px-4 py-3.5 rounded-xl text-white font-bold text-sm cursor-pointer flex items-center justify-center gap-2"
                  onClick={() => goTo("route")}
                >
                  <Icon icon={icons.document} />
                  Report Issue at this Stop
                </button>
              </div>
            </div>


            {/* ROUTE PROGRESS */}

            <div
              className="bg-white rounded-[18px] border border-gray-200 flex flex-col overflow-hidden"
              style={{ height: isMobile ? "auto" : 260 }}
            >
              <div className="px-[18px] pt-[18px] pb-3 bg-white border-b border-gray-100">
                <div
                  className="text-lg font-bold mb-3 cursor-pointer"
                  onClick={() => goTo("route")}
                >
                  Route Progress
                </div>

                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-900"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex justify-between text-[13px] mt-2">
                  <span>{completed} Completed</span>
                  <span>{total - completed} Remaining</span>
                </div>
              </div>


              <div className="px-[18px] overflow-y-auto flex-1">
                {routeStops.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-3.5 border-b border-gray-100"
                  >
                    <div
                      className={`w-1 self-stretch rounded ${stripColor[s.status]}`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold opacity-45">
                        {s.date}
                      </div>

                      <div className="font-semibold text-sm">
                        {s.name}
                      </div>

                      <div className="text-xs opacity-60">
                        {s.subtitle}
                      </div>
                    </div>


                    <div className="flex flex-col items-end gap-1.5">
                      <div
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${pillClass[s.status]}`}
                      >
                        {s.status}
                      </div>

                      <div
                        className="text-xs font-bold opacity-70 cursor-pointer"
                        onClick={() => goTo("route")}
                      >
                        Details ›
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>


      {isMobile && (
        <BottomNav
          activeKey={activeMobileKey}
          onNavigate={goTo}
        />
      )}

      {isMobile && <Fab onNavigate={goTo} />}

      {confirmOpen && (
        <LogoutConfirmModal
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleLogout}
        />
      )}
    </div>
  );
}

export default DriverDashboard;