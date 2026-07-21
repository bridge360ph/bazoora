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
import { layout, mainWrap } from "./shared/layoutStyles";

/* ---------------- DATA ---------------- */
type Channel = {
  id: string;
  name: string;
  subtitle: string;
  initials: string;
  timestamp: string;
  unread?: boolean;
};

const channels: Channel[] = [
  {
    id: "dispatch",
    name: "Dispatch Operations",
    subtitle: "Please confirm arrival at Station B.",
    initials: "DO",
    timestamp: "10:45 AM",
  },
  {
    id: "menro",
    name: "MENRO Admin",
    subtitle: "Updated maintenance schedule fo...",
    initials: "MA",
    timestamp: "Yesterday",
    unread: true,
  },
];

type Message = {
  from: "them" | "me";
  text: string;
  time: string;
  sender?: string;
  read?: boolean;
};

const threadDateLabel: Record<string, string> = {
  dispatch: "TODAY, AUGUST 24",
  menro: "YESTERDAY, AUGUST 23",
};

const threadByChannel: Record<string, Message[]> = {
  dispatch: [
    {
      from: "them",
      sender: "Dispatch (HQ)",
      text:
        "System Update: The collection route for Zone 4 has been optimized. Please follow the new GPS markers in your navigation tab.",
      time: "08:12 AM",
    },
    {
      from: "me",
      text:
        "Understood. I am currently at Station A clearing the last bin. Will proceed to the updated Zone 4 route in 10 minutes.",
      time: "08:15 AM",
      read: true,
    },
    {
      from: "them",
      sender: "Dispatch (HQ)",
      text: "Please confirm arrival at Station B. There is a reported blockage at the main gate.",
      time: "08:20 AM",
    },
  ],
  menro: [
    {
      from: "them",
      sender: "MENRO Admin",
      text: "Updated maintenance schedule for Unit BT-04 is now available — please review before your next shift.",
      time: "Yesterday",
    },
  ],
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
export function Messages() {
  const navigate = useNavigate();
  const clearSession = useAuthStore((s) => s.clear);

  const activeKey = "messages";
  const activeMobileKey = "messages";

  const isMobile = useIsMobile();
  const [navOpen, setNavOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
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

  const activeChannel = channels.find((c) => c.id === activeChannelId) ?? null;
  const thread = activeChannelId ? threadByChannel[activeChannelId] ?? [] : [];
  const dateLabel = activeChannelId ? threadDateLabel[activeChannelId] : null;

  const showChannelList = !isMobile || !activeChannel;
  const showThread = !isMobile || !!activeChannel;

  // On mobile, an open thread takes over the whole screen with its own
  // chat header (back button, channel name, search, dots) — matching the
  // target design, there's no BAZOORA/bell/avatar bar (and therefore no
  // Account/Notifications/System/Logout menu) while a conversation is
  // open. That menu only needs to work on the channel-list screen, where
  // the shared Header below is rendered.
  const showSharedHeader = !isMobile || !activeChannel;

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
        {showSharedHeader && (
          <Header
            isMobile={isMobile}
            title="Messages"
            onToggleNav={() => setNavOpen((v) => !v)}
            onSelectSettingsTab={goToSettingsTab}
            onLogout={() => setConfirmOpen(true)}
          />
        )}

        <main
          className={
            isMobile
              ? `${activeChannel ? "p-0" : "p-3.5 pb-24"} flex-1 flex flex-col min-h-0`
              : "p-[18px] flex-1 flex flex-col min-h-0"
          }
        >
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
                      <div className="w-9 h-9 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {c.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-bold text-slate-900">{c.name}</div>
                          <div className="text-[11px] opacity-45 flex-shrink-0">{c.timestamp}</div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs opacity-55 truncate">{c.subtitle}</div>
                          {c.unread && (
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CHAT THREAD */}
            {showThread && activeChannel && (
              <div
                className={`bg-white flex flex-col overflow-hidden relative min-h-0 ${
                  isMobile ? "flex-1" : "rounded-2xl border border-gray-200"
                }`}
              >
                <div
                  className={`flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 flex-shrink-0 ${
                    isMobile ? "bg-[#0f2a1f] text-white" : ""
                  }`}
                >
                  {isMobile && (
                    <div className="cursor-pointer" onClick={() => setActiveChannelId(null)}>
                      <Icon icon={icons.arrowLeft} size={18} />
                    </div>
                  )}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isMobile ? "bg-white/15 text-white" : "bg-green-100 text-green-800"
                    }`}
                  >
                    {activeChannel.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-bold ${isMobile ? "text-white" : "text-slate-900"}`}>
                      {activeChannel.name}
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${isMobile ? "text-green-300" : "text-green-700"}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Online
                    </div>
                  </div>
                  <div className={`flex items-center gap-3 ${isMobile ? "opacity-90" : "opacity-60"}`}>
                    <Icon icon={icons.search} size={16} />
                    <Icon icon={icons.dots} size={16} />
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-3">
                  {dateLabel && (
                    <div className="text-center text-[11px] font-bold tracking-wide opacity-40 mb-1">
                      {dateLabel}
                    </div>
                  )}

                  {thread.map((m, i) => (
                    <div key={i} className={`flex flex-col ${m.from === "me" ? "items-end" : "items-start"}`}>
                      {m.from === "them" && m.sender && (
                        <div className="text-[11px] font-bold opacity-45 mb-1 ml-1">{m.sender}</div>
                      )}
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm ${
                          m.from === "me" ? "bg-[#0f2a1f] text-white" : "bg-gray-100 text-slate-900"
                        }`}
                      >
                        {m.text}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] opacity-40 mt-1">
                        <span>{m.time}</span>
                        {m.from === "me" && m.read && <Icon icon={icons.check} size={11} />}
                      </div>
                    </div>
                  ))}
                </div>

                {!isMobile && (
                  <div className="absolute left-3.5 bottom-[72px] bg-[#0f2a1f] text-white rounded-2xl p-3.5 w-[220px] shadow-lg">
                    <div className="text-sm font-bold mb-0.5">Hotline Support</div>
                    <div className="text-xs opacity-70 mb-2.5">Emergency assistance, available 24/7.</div>
                    <button className="w-full bg-red-600 text-white text-xs font-bold rounded-lg py-2 flex items-center justify-center gap-1.5">
                      <Icon icon={icons.phone} size={13} />
                      Call Incident Response
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 px-3.5 py-3 border-t border-gray-100 flex-shrink-0">
                  <div className="opacity-50 cursor-pointer">
                    <Icon icon={icons.camera} size={18} />
                  </div>
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
                    className="bg-green-400 text-[#0f2a1f] rounded-full px-4 py-2.5 flex items-center gap-1.5 font-bold text-sm flex-shrink-0"
                    onClick={() => setDraft("")}
                  >
                    Send
                    <Icon icon={icons.send} size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {isMobile && <BottomNav activeKey={activeMobileKey} onNavigate={goTo} />}
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

export default Messages;