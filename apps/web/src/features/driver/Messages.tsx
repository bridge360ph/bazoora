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
type Channel = {
  id: string;
  name: string;
  subtitle: string;
  initials: string;
};

const channels: Channel[] = [
  { id: "dispatch", name: "Dispatch", subtitle: "Unit dispatch — I am currently at Station A.", initials: "DO" },
  { id: "menro", name: "MENRO Admin", subtitle: "Updated maintenance schedule for...", initials: "MA" },
];

type Message = {
  from: "them" | "me";
  text: string;
  time: string;
};

const threadByChannel: Record<string, Message[]> = {
  dispatch: [
    {
      from: "them",
      text:
        "System Update: The collection route for Zone A has been optimized. Please follow the updated GPS markers on your navigation tab.",
      time: "9:15 AM",
    },
    {
      from: "me",
      text:
        "Understood. I am currently at Station A clearing the last bin. Will proceed to the updated Zone A route in 10 minutes.",
      time: "9:17 AM",
    },
    {
      from: "them",
      text: "Please confirm on arrival at Station B. There is a reported spillage on the road.",
      time: "9:19 AM",
    },
  ],
  menro: [
    {
      from: "them",
      text: "Updated maintenance schedule for Unit BT-04 is now available — please review before your next shift.",
      time: "Yesterday",
    },
  ],
};

/* ---------------- COMPONENT ---------------- */
export function Messages() {
  const navigate = useNavigate();

  const activeKey = "messages";
  const activeMobileKey = "messages";

  const isMobile = useIsMobile();
  const [navOpen, setNavOpen] = useState(false);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(isMobile ? null : "dispatch");
  const [draft, setDraft] = useState("");

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

  const activeChannel = channels.find((c) => c.id === activeChannelId) ?? null;
  const thread = activeChannelId ? threadByChannel[activeChannelId] ?? [] : [];

  const showChannelList = !isMobile || !activeChannel;
  const showThread = !isMobile || !!activeChannel;

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
        <Header isMobile={isMobile} title="Messages" onToggleNav={() => setNavOpen((v) => !v)} onAvatarClick={() => goTo("settings")} />

        <main className={isMobile ? "p-3.5 pb-24 flex-1 flex flex-col min-h-0" : "p-[18px] flex-1 flex flex-col min-h-0"}>
          <div
            className={isMobile ? "flex-1 flex flex-col min-h-0" : "grid gap-4 flex-1 min-h-0"}
            style={!isMobile ? { gridTemplateColumns: "280px 1fr" } : undefined}
          >
            {/* CHANNEL LIST */}
            {showChannelList && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
                <div className="px-4 py-3.5 border-b border-gray-100 text-xs font-bold tracking-wide opacity-50 uppercase">
                  Channels
                </div>
                <div className="flex flex-col overflow-y-auto">
                  {channels.map((c) => (
                    <div
                      key={c.id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 ${
                        activeChannelId === c.id ? "bg-gray-50" : ""
                      }`}
                      onClick={() => setActiveChannelId(c.id)}
                    >
                      <div className="w-9 h-9 rounded-full bg-[#0f2a1f] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {c.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900">{c.name}</div>
                        <div className="text-xs opacity-55 truncate">{c.subtitle}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CHAT THREAD */}
            {showThread && activeChannel && (
              <div className="bg-white rounded-2xl border border-gray-200 flex flex-col overflow-hidden relative min-h-0">
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 flex-shrink-0">
                  {isMobile && (
                    <div className="cursor-pointer" onClick={() => setActiveChannelId(null)}>
                      <Icon icon={icons.arrowLeft} size={18} />
                    </div>
                  )}
                  <div className="w-9 h-9 rounded-full bg-[#0f2a1f] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {activeChannel.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900">{activeChannel.name}</div>
                    <div className="flex items-center gap-1 text-xs text-green-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Active
                    </div>
                  </div>
                  <div className="flex items-center gap-3 opacity-60">
                    <Icon icon={icons.search} size={16} />
                    <Icon icon={icons.dots} size={16} />
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-3">
                  {thread.map((m, i) => (
                    <div key={i} className={`flex flex-col ${m.from === "me" ? "items-end" : "items-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm ${
                          m.from === "me" ? "bg-[#0f2a1f] text-white" : "bg-gray-100 text-slate-900"
                        }`}
                      >
                        {m.text}
                      </div>
                      <div className="text-[10px] opacity-40 mt-1">{m.time}</div>
                    </div>
                  ))}
                </div>

                {/* Hotline Support card */}
                <div className="absolute left-3.5 bottom-[72px] bg-[#0f2a1f] text-white rounded-2xl p-3.5 w-[220px] shadow-lg">
                  <div className="text-sm font-bold mb-0.5">Hotline Support</div>
                  <div className="text-xs opacity-70 mb-2.5">Emergency assistance, available 24/7.</div>
                  <button className="w-full bg-red-600 text-white text-xs font-bold rounded-lg py-2 flex items-center justify-center gap-1.5">
                    <Icon icon={icons.phone} size={13} />
                    Call Incident Response
                  </button>
                </div>

                <div className="flex items-center gap-2 px-3.5 py-3 border-t border-gray-100 flex-shrink-0">
                  <div className="opacity-50 cursor-pointer">
                    <Icon icon={icons.paperclip} size={18} />
                  </div>
                  <div className="opacity-50 cursor-pointer">
                    <Icon icon={icons.smile} size={18} />
                  </div>
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={`Type a message to ${activeChannel.name}...`}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-3.5 py-2 text-sm"
                  />
                  <button
                    className="bg-green-400 text-[#0f2a1f] rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0"
                    onClick={() => setDraft("")}
                  >
                    <Icon icon={icons.send} size={15} />
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

export default Messages;