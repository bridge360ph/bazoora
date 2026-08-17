import { useLocation, useNavigate } from "react-router-dom";

import { Sidebar } from "./shared/Sidebar";
import { Header } from "./shared/Header";
import type { SettingsTab } from "./shared/Header";
import { BottomNav } from "./shared/BottomNav";
import { Fab } from "./shared/Fab";
import { useIsMobile } from "./shared/useIsMobile";
import { layout, mainWrap } from "./shared/layoutStyles";

import CompletedRouteMap from "./completed-route/components/CompletedRouteMap";

type CompletedStop = {
  id: string;
  name: string;
  barangay: string;
  wasteType: string;
  volume: string | number;
  priority: string;
  lat: number;
  lng: number;
  status?: "pending" | "active" | "completed";
};

type CompletedRouteLocationState = {
  stop?: CompletedStop;
};

export function CompletedRoute() {
  const navigate = useNavigate();
  const location = useLocation();

  const isMobile = useIsMobile();

  const state = location.state as CompletedRouteLocationState | null;
  const selectedStop = state?.stop;

  if (!selectedStop) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-bold text-slate-900">
            No completed route selected
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Please select a completed task from your assigned tasks.
          </p>

          <button
            type="button"
            onClick={() => {
              void navigate("/driver/route");
            }}
            className="mt-5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
          >
            Back to Current Route
          </button>
        </div>
      </div>
    );
  }

  const goTo = (key: string) => {
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

  const goToSettingsTab = (tab: SettingsTab) => {
    void navigate(`/driver/settings?tab=${tab}`);
  };

  return (
    <div className={layout}>
      <Sidebar
        activeKey="route"
        isMobile={isMobile}
        navOpen={false}
        onNavigate={goTo}
        onClose={() => {}}
      />

      <div className={mainWrap}>
        <Header
          isMobile={isMobile}
          title="Completed Route"
          onToggleNav={() => {}}
          onSelectSettingsTab={goToSettingsTab}
          onLogout={() => {}}
        />

        {/* Back Button */}
        <div className="px-6 pt-4">
          <button
            type="button"
            onClick={() => {
              void navigate("/driver/route");
            }}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-gray-50"
          >
            ← Back to Current Route
          </button>
        </div>

        <main
          className={
            isMobile
              ? "space-y-4 p-4 pb-24"
              : "space-y-5 p-6"
          }
        >
          {/* Route Summary */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">
              ✅ Completed Collection
            </h2>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Location</p>
                <p className="font-semibold">
                  {selectedStop.name}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Barangay</p>
                <p className="font-semibold">
                  {selectedStop.barangay}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Waste Type</p>
                <p className="font-semibold">
                  {selectedStop.wasteType}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Volume</p>
                <p className="font-semibold">
                  {selectedStop.volume}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Status</p>
                <p className="font-bold text-emerald-600">
                  Completed
                </p>
              </div>

              <div>
                <p className="text-slate-500">Priority</p>
                <p className="font-semibold">
                  {selectedStop.priority}
                </p>
              </div>
            </div>
          </div>

          {/* Completed Route Map */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">
              🗺️ Collection Point Map
            </h2>

            <CompletedRouteMap stop={selectedStop} />
          </div>

          {/* Timeline */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">
              📍 Collection Timeline
            </h2>

            <div className="space-y-4">
              <div>
                <p className="font-semibold">
                  ✔ Arrived at Collection Point
                </p>
                <p className="text-sm text-slate-500">
                  8:12 AM
                </p>
              </div>

              <div>
                <p className="font-semibold">
                  ✔ Waste Collected
                </p>
                <p className="text-sm text-slate-500">
                  8:20 AM
                </p>
              </div>

              <div>
                <p className="font-semibold">
                  ✔ Collection Completed
                </p>
                <p className="text-sm text-slate-500">
                  8:30 AM
                </p>
              </div>
            </div>
          </div>

          {/* Driver Information */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">
              👤 Driver Information
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">
                  Driver
                </span>

                <span className="font-semibold">
                  Juan Dela Cruz
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Truck
                </span>

                <span className="font-semibold">
                  Truck 03
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Plate Number
                </span>

                <span className="font-semibold">
                  ABC-1234
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {isMobile && (
        <>
          <BottomNav
            activeKey="route"
            onNavigate={goTo}
          />

          <Fab onNavigate={goTo} />
        </>
      )}
    </div>
  );
}

export default CompletedRoute;