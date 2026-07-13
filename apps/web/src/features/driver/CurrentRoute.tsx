import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Icon } from "./shared/icons";
import { icons } from "./shared/iconData";
import { Sidebar } from "./shared/Sidebar";
import { Header } from "./shared/Header";
import { BottomNav } from "./shared/BottomNav";
import { Fab } from "./shared/Fab";
import { useIsMobile } from "./shared/useIsMobile";
import { layout, mainWrap } from "./shared/layoutStyles";

/* ---------------- DATA ----------------
   Route + Assigned Tasks merged: each stop carries both the route timing
   status (DONE/NOW/IN PROGRESS/UPCOMING) and the task detail (barangay,
   address, waste type, volume, priority) that used to live on a separate
   Assigned Tasks screen — rendered here as a compact mini task-card. */
type StopStatus = "DONE" | "NOW" | "IN_PROGRESS" | "UPCOMING";
type Priority = "Critical" | "High" | "Medium" | "Low";
type WasteType = "Residual" | "Hazardous" | "Non-Bio" | "Biodegradable";

type Stop = {
  stopNumber: string;
  status: StopStatus;
  statusLabel?: string;
  barangay: string;
  name: string;
  address: string;
  wasteType: WasteType;
  volume: string;
  priority: Priority;
};

const schedule: Stop[] = [
  {
    stopNumber: "01",
    status: "DONE",
    statusLabel: "DONE • 08:30 AM",
    barangay: "Brgy. San Rafael",
    name: "Sitio Malakas",
    address: "12 households • Residential Area",
    wasteType: "Residual",
    volume: "2.0 cu.m",
    priority: "Medium",
  },
  {
    stopNumber: "02",
    status: "NOW",
    statusLabel: "NOW",
    barangay: "Brgy. San Rafael",
    name: "Purok 7",
    address: "Industrial Park Hub • Warehouse A",
    wasteType: "Hazardous",
    volume: "1.2 Tons",
    priority: "Critical",
  },
  {
    stopNumber: "03",
    status: "IN_PROGRESS",
    statusLabel: "IN PROGRESS",
    barangay: "Brgy. Manggahan",
    name: "Purok 12",
    address: "8 households • Commercial Strip",
    wasteType: "Non-Bio",
    volume: "3.0 cu.m",
    priority: "High",
  },
  {
    stopNumber: "04",
    status: "UPCOMING",
    barangay: "Brgy. Biela",
    name: "Sitio Pag-asa",
    address: "20 households • Village Block",
    wasteType: "Biodegradable",
    volume: "5.5 cu.m",
    priority: "Low",
  },
];

const statusBadgeClass: Record<StopStatus, string> = {
  DONE: "bg-green-100 text-green-800",
  NOW: "bg-white text-[#0f2a1f]",
  IN_PROGRESS: "bg-orange-100 text-orange-800",
  UPCOMING: "bg-gray-100 text-slate-600",
};

function MiniTaskCard({ stop }: { stop: Stop }) {
  const isNow = stop.status === "NOW";
  const isCritical = stop.priority === "Critical";
  const isHazardous = stop.wasteType === "Hazardous";

  return (
    <div
      className={`rounded-xl border p-3 flex flex-col gap-2 ${
        isNow ? "bg-[#0f2a1f] border-[#0f2a1f] text-white" : "bg-white border-gray-100"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`w-[26px] h-[26px] rounded-full text-[11px] font-bold flex items-center justify-center flex-shrink-0 ${
            isNow ? "bg-green-400 text-[#0f2a1f]" : "bg-gray-200 text-slate-600"
          }`}
        >
          {stop.stopNumber}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div className={`text-sm font-bold ${isNow ? "text-white" : "text-slate-900"}`}>{stop.name}</div>
            <div
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1 flex-shrink-0 ${statusBadgeClass[stop.status]}`}
            >
              {stop.status === "NOW" && <Icon icon={icons.bookmark} size={10} />}
              {stop.statusLabel ?? stop.status}
            </div>
          </div>
          <div className={`text-[11px] mt-0.5 ${isNow ? "text-white/70" : "opacity-55"}`}>
            {stop.barangay} • {stop.address}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 pl-[34px]">
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            isHazardous ? "bg-red-100 text-red-700" : isNow ? "bg-white/10 text-white/80" : "bg-gray-100 text-slate-600"
          }`}
        >
          {stop.wasteType}
        </span>
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            isCritical
              ? "bg-red-600 text-white"
              : stop.priority === "High"
              ? "bg-orange-100 text-orange-800"
              : isNow
              ? "bg-white/10 text-white/80"
              : "bg-gray-100 text-slate-600"
          }`}
        >
          {stop.priority}
        </span>
        <span className={`text-[10px] font-bold ml-auto ${isNow ? "text-white/60" : "opacity-45"}`}>{stop.volume}</span>
      </div>
    </div>
  );
}

/* ---------------- COMPONENT ---------------- */
export function CurrentRoute() {
  const navigate = useNavigate();

  const activeKey = "route";
  const activeMobileKey = "route";

  const isMobile = useIsMobile();
  const [navOpen, setNavOpen] = useState(false);

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
        <Header isMobile={isMobile} title="Route & Assigned Tasks" onToggleNav={() => setNavOpen((v) => !v)} />

        <main className={isMobile ? "p-3.5 pb-24" : "p-[18px]"}>
          <div
            className={isMobile ? "flex flex-col gap-4" : "grid gap-4 items-start"}
            style={!isMobile ? { gridTemplateColumns: "1fr 340px" } : undefined}
          >
            <div className="flex flex-col gap-4 min-w-0">
              <div className="relative bg-[#eef1ef] rounded-2xl border border-gray-200 p-3.5 h-[480px] flex flex-col">
                <div className="text-[13px] font-bold text-slate-700 mb-2.5">Map View</div>

                <div className="flex-1 rounded-xl overflow-hidden bg-[#eef1ef]">
                  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line x1="8" y1="8" x2="92" y2="92" stroke="#e2e6e3" strokeWidth={2} />
                    <line x1="92" y1="8" x2="8" y2="92" stroke="#e2e6e3" strokeWidth={2} />
                    <rect x="8" y="8" width="84" height="84" fill="none" stroke="#e2e6e3" strokeWidth={2} />
                  </svg>
                </div>

                <div className="absolute top-[54px] right-[22px] flex flex-col gap-2.5">
                  <div className="w-[38px] h-[38px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.12)] flex items-center justify-center text-[#0f2a1f] cursor-pointer">
                    <Icon icon={icons.locate} size={18} />
                  </div>
                  <div className="w-[38px] h-[38px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.12)] flex items-center justify-center text-[#0f2a1f] cursor-pointer">
                    <Icon icon={icons.layers} size={18} />
                  </div>
                </div>

                <div className="absolute left-[22px] right-[22px] bottom-[22px] bg-[#0f2a1f] text-white rounded-2xl px-4 py-3.5 flex items-center gap-3">
                  <div className="w-[34px] h-[34px] rounded-[10px] bg-white/15 flex items-center justify-center flex-shrink-0">
                    <Icon icon={icons.turnRight} size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold tracking-wide opacity-70 mb-0.5 uppercase">
                      IN 450 METERS
                    </div>
                    <div className="text-[15px] font-bold">Turn Right onto Industrial Parkway</div>
                  </div>
                </div>
              </div>

              <div className={isMobile ? "flex flex-col gap-3" : "grid grid-cols-2 gap-4"}>
                <div className="bg-white rounded-2xl border border-gray-200 p-4 min-w-0">
                  <div className="text-[11px] font-bold tracking-wide opacity-50 mb-2">ROUTE OVERVIEW</div>
                  <div className="text-[17px] font-extrabold mb-2.5">Route 1 - 12.4 km</div>
                  <div className="flex items-start gap-1.5 text-[13px] text-slate-700 mb-1.5">
                    <Icon icon={icons.pin} size={15} />
                    <span>Purok 7, Brgy. San Rafael, General Trias</span>
                  </div>
                  <div className="text-xs opacity-55">2.8 km from last collection point</div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-4 min-w-0">
                  <div className="text-[11px] font-bold tracking-wide opacity-50 mb-2">DESTINATION POINT</div>
                  <div className="flex items-center gap-3 mb-3.5">
                    <div className="w-[38px] h-[38px] rounded-[10px] bg-green-100 text-green-800 flex items-center justify-center flex-shrink-0">
                      <Icon icon={icons.bin} size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[15px] font-bold">Industrial Park Hub</div>
                      <div className="text-xs opacity-55">Purok 12, Brgy. Manggahan, Cavite</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="text-[11px] font-bold opacity-50 tracking-wide">GENERAL ETC</span>
                    <span className="text-sm font-extrabold">01:05 PM</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 flex flex-col overflow-hidden h-full">
              <div className="px-[18px] pt-[18px] pb-3 border-b border-gray-100">
                <div className="text-[10px] font-bold tracking-wide text-green-700 uppercase mb-1">
                  Assigned Tasks
                </div>
                <div
                  className="text-lg font-extrabold mb-1 cursor-pointer"
                  onClick={() => goTo("dashboard")}
                  title="Back to Dashboard"
                >
                  Daily Schedule
                </div>
                <div className="text-xs opacity-55">14 Collections • 3.2 tons est.</div>
              </div>

              <div className="px-3.5 py-2.5 flex flex-col gap-2.5 overflow-y-auto flex-1">
                {schedule.map((stop, i) => (
                  <MiniTaskCard key={i} stop={stop} />
                ))}
              </div>

              <div className="mt-auto p-3.5 flex flex-col gap-2.5 border-t border-gray-100">
                <button
                  className="bg-green-400 border-none px-4 py-3.5 rounded-xl font-bold text-sm cursor-pointer flex items-center justify-center gap-2"
                  onClick={() => goTo("dashboard")}
                >
                  <Icon icon={icons.check} />
                  Mark as Complete
                </button>
                <button className="bg-red-600 border-none px-4 py-3.5 rounded-xl text-white font-bold text-sm cursor-pointer flex items-center justify-center gap-2">
                  <Icon icon={icons.document} />
                  Report Issue at this Stop
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {isMobile && <BottomNav activeKey={activeMobileKey} onNavigate={goTo} />}
      {isMobile && <Fab onNavigate={goTo} />}
    </div>
  );
}

export default CurrentRoute;