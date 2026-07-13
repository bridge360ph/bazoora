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

/* ---------------- DATA ---------------- */
type ReportStatus = "RESOLVED" | "PENDING" | "DENIED";

type ReportEntry = {
  date: string;
  title: string;
  location: string;
  status: ReportStatus;
};

const reportHistory: ReportEntry[] = [
  {
    date: "OCT 24, 2023 • 09:15 AM",
    title: "Inaccessible Area",
    location: "Purok 7, Brgy. San Rafael",
    status: "RESOLVED",
  },
  {
    date: "OCT 22, 2023 • 02:40 PM",
    title: "Vehicle Problem",
    location: "Unit BT-04, Central Depot",
    status: "PENDING",
  },
  {
    date: "OCT 20, 2023 • 11:05 AM",
    title: "Road Blockage",
    location: "Purok 12, Brgy. Manggahan",
    status: "DENIED",
  },
];

const statusClass: Record<ReportStatus, string> = {
  RESOLVED: "bg-green-100 text-green-800",
  PENDING: "bg-orange-100 text-orange-800",
  DENIED: "bg-red-100 text-red-800",
};

const reportTypes = ["Missed Collection", "Vehicle Problem", "Road Blockage", "Inaccessible Area", "Other"];
const wasteTypes = ["Residual", "Biodegradable", "Non-Biodegradable", "Hazardous"];

/* ---------------- COMPONENT ---------------- */
export function ReportIssue() {
  const navigate = useNavigate();

  const activeKey = "report";
  const activeMobileKey = "report";

  const isMobile = useIsMobile();
  const [navOpen, setNavOpen] = useState(false);
  const [tab, setTab] = useState<"new" | "history">("new");
  const [page, setPage] = useState(1);

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

      case "settings":
        void navigate("/driver/settings");
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
        <Header isMobile={isMobile} title="Report Issue" onToggleNav={() => setNavOpen((v) => !v)} onAvatarClick={() => goTo("settings")} />

        <main className={isMobile ? "p-3.5 pb-24" : "p-[18px]"}>
          <div className="max-w-2xl mx-auto flex flex-col gap-4">
            {/* TABS */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold ${
                  tab === "new" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
                onClick={() => setTab("new")}
              >
                New Report
              </button>
              <button
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold ${
                  tab === "history" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
                onClick={() => setTab("history")}
              >
                Report History
              </button>
            </div>

            {tab === "new" ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
                <div>
                  <div className="text-xs font-bold opacity-60 mb-1.5">Report ID</div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-slate-500">
                    RPT-20250413-001 (auto)
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold opacity-60 mb-1.5">Report Type</div>
                  <div className="relative">
                    <select className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-slate-900">
                      <option value="">Select Type</option>
                      {reportTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                      <Icon icon={icons.chevronDown} size={16} />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold opacity-60 mb-1.5">Photo Attachment (optional)</div>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center justify-center gap-2 text-center cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-slate-500">
                      <Icon icon={icons.camera} size={18} />
                    </div>
                    <div className="text-xs font-bold text-slate-600">Tap to upload/capture issue photo</div>
                    <div className="text-[11px] opacity-45">PNG, JPG up to 10MB</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold opacity-60 mb-1.5">Waste Type</div>
                  <div className="relative">
                    <select className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-slate-900">
                      <option value="">Select Type</option>
                      {wasteTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                      <Icon icon={icons.chevronDown} size={16} />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold opacity-60 mb-1.5">Reason / Description</div>
                  <textarea
                    rows={4}
                    placeholder="Provide a detailed description of the incident..."
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-3 text-sm resize-none"
                  />
                </div>

                <button className="bg-green-400 border-none px-4 py-3.5 rounded-xl font-bold text-sm cursor-pointer flex items-center justify-center gap-2">
                  Submit Report
                  <Icon icon={icons.chevronRight} size={16} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {reportHistory.map((r, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-gray-200 p-4 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold tracking-wide opacity-45 uppercase mb-1">{r.date}</div>
                      <div className="text-sm font-bold text-slate-900">{r.title}</div>
                      <div className="flex items-center gap-1 text-xs opacity-55 mt-0.5">
                        <Icon icon={icons.pin} size={12} />
                        <span>{r.location}</span>
                      </div>
                      <div className="text-xs font-bold opacity-70 cursor-pointer mt-2">Details ›</div>
                    </div>
                    <div
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${statusClass[r.status]}`}
                    >
                      {r.status}
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-slate-500 disabled:opacity-30"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <Icon icon={icons.chevronLeft} size={14} />
                  </button>
                  <div className="w-8 h-8 rounded-full bg-[#0f2a1f] text-white flex items-center justify-center text-xs font-bold">
                    {page}
                  </div>
                  <button
                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-slate-500"
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <Icon icon={icons.chevronRight} size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {isMobile && <BottomNav activeKey={activeMobileKey} onNavigate={goTo} />}
      {isMobile && <Fab onNavigate={goTo} />}
    </div>
  );
}

export default ReportIssue;