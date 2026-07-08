import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Icon } from "./shared/icons";
import { icons } from "./shared/iconData";
import { Sidebar } from "./shared/Sidebar";
import { Header } from "./shared/Header";
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
  rowBetween,
  pillOrangeSmall,
  pillGreenSmall,
} from "./shared/layoutStyles";

/* ---------------- DATA ---------------- */
type LogStatus = "COMPLETED" | "REPORTED" | "PENDING";

const collectionLog: {
  name: string;
  date: string;
  subtitle: string;
  status: LogStatus;
}[] = [
  {
    name: "Sitio Malakas, Brgy. San Rafael",
    date: "OCT 24, 2023 • 14:22",
    subtitle: "12 households • Residential Area",
    status: "COMPLETED",
  },
  {
    name: "Purok 7, Brgy. San Rafael",
    date: "OCT 24, 2023 • 14:22",
    subtitle: "Industrial Park Hub • Warehouse A",
    status: "REPORTED",
  },
  {
    name: "Purok 12, Brgy. Manggahan",
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

const stripColor: Record<LogStatus, string> = {
  COMPLETED: "bg-green-500",
  REPORTED: "bg-red-500",
  PENDING: "bg-amber-500",
};
// PENDING entries get action buttons instead of a status pill, so only
// COMPLETED/REPORTED need a pill class.
const pillClass: Record<"COMPLETED" | "REPORTED", string> = {
  COMPLETED: "bg-green-100 text-green-800",
  REPORTED: "bg-red-100 text-red-800",
};

/* ---------------- COMPONENT ---------------- */
export function Collections() {
  const navigate = useNavigate();

  const activeKey = "collections";
  // No dedicated mobile bottom-nav slot for Collections (same as Assigned
  // Tasks) — falls back to no highlighted item.
  const activeMobileKey = "collections";

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
        <Header isMobile={isMobile} title="Logs" onToggleNav={() => setNavOpen((v) => !v)} />

        <main className={isMobile ? "p-3.5 pb-24" : "p-[18px]"}>
          {/* TOP SUMMARY CARDS */}
          <div className={isMobile ? topCardsMobile : topCards}>
            <div className={smallCardRow}>
              <div className="min-w-0">
                <div className={smallLabel}>Collections Today</div>
                <div className={smallValue}>8</div>
              </div>
              <div className={pillGreenSmall}>COMPLETED</div>
            </div>

            <div className={smallCardRow}>
              <div className="min-w-0">
                <div className={smallLabel}>Issues Reported</div>
                <div className={smallValue}>1</div>
              </div>
              <div className={pillOrangeSmall}>IN PROGRESS</div>
            </div>

            <div className={`${smallCard} ${isMobile ? "col-span-2" : ""}`}>
              <div className={smallLabel}>Waste Collected</div>
              <div className={rowBetween}>
                <div className={smallValue}>1.4t</div>
                <div className="text-[11px] opacity-50 italic">Estimated</div>
              </div>
            </div>
          </div>

          {/* COLLECTION LOG */}
          <div className="bg-white rounded-[18px] border border-gray-200 overflow-hidden">
            <div className="flex justify-between items-center px-[18px] pt-[18px] pb-3 border-b border-gray-100">
              <div className="text-lg font-bold">Collection Log</div>
              <div className="flex items-center gap-1.5 text-xs font-bold opacity-65 cursor-pointer italic">
                <Icon icon={icons.download} size={14} />
                Export CSV
              </div>
            </div>

            <div className="px-[18px]">
              {collectionLog.map((entry, i) => (
                <div key={i} className="flex items-center gap-3 py-3.5 border-b border-gray-100 min-h-16">
                  <div className={`w-1 self-stretch rounded ${stripColor[entry.status]}`} />

                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold tracking-wide opacity-45 mb-0.5 uppercase">
                      {entry.date}
                    </div>
                    <div className="font-semibold text-sm">{entry.name}</div>
                    <div className="text-xs opacity-60">{entry.subtitle}</div>
                  </div>

                  {entry.status === "PENDING" ? (
                    <div className="flex gap-2 flex-shrink-0">
                      <div
                        className="w-[34px] h-[34px] rounded-[10px] bg-[#003d1f] text-green-400 flex items-center justify-center cursor-pointer"
                        title="Mark as complete"
                        onClick={() => {
                          /* wire up to real completion state when the backend exists */
                        }}
                      >
                        <Icon icon={icons.check} size={16} />
                      </div>
                      <div
                        className="w-[34px] h-[34px] rounded-[10px] bg-red-600 text-white flex items-center justify-center cursor-pointer"
                        title="Report an issue"
                        onClick={() => goTo("route")}
                      >
                        <Icon icon={icons.alert} size={16} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <div
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${pillClass[entry.status]}`}
                      >
                        {entry.status}
                      </div>

                      <div
                        className="text-xs font-bold opacity-70 cursor-pointer"
                        onClick={() => goTo("route")}
                      >
                        Details ›
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {isMobile && <BottomNav activeKey={activeMobileKey} onNavigate={goTo} />}
      {isMobile && <Fab onNavigate={goTo} />}
    </div>
  );
}

export default Collections;