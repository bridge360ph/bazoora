import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";

import { Icon } from "./shared/icons";
import { icons } from "./shared/iconData";
import { Sidebar } from "./shared/Sidebar";
import { Header } from "./shared/Header";
import { BottomNav } from "./shared/BottomNav";
import { Fab } from "./shared/Fab";
import { useIsMobile } from "./shared/useIsMobile";
import { layout, mainWrap } from "./shared/layoutStyles";

type Tab = "account" | "notifications" | "system";

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: "account", label: "Account", icon: "profile" },
  { key: "notifications", label: "Notifications", icon: "bell" },
  { key: "system", label: "System", icon: "settings" },
];

const inputClass =
  "w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900";
const labelClass = "text-xs font-bold opacity-60 mb-1.5";

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
export function Settings() {
  const navigate = useNavigate();
  const clearSession = useAuthStore((s) => s.clear);
  const [searchParams] = useSearchParams();

  const activeKey = "settings";
  const activeMobileKey = "settings";

  const isMobile = useIsMobile();
  const [navOpen, setNavOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

const tab = (searchParams.get("tab") as Tab | null) ?? "account";

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

      case "settings":
        void navigate("/driver/settings");
        break;

      default:
        break;
    }
  };

  const goToSettingsTab = (settingsTab: Tab) => {
    void navigate(`/driver/settings?tab=${settingsTab}`);
  };

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
          title="Settings"
          onToggleNav={() => setNavOpen((v) => !v)}
          onSelectSettingsTab={goToSettingsTab}
          onLogout={() => setConfirmOpen(true)}
        />

        <main className={isMobile ? "p-3.5 pb-24" : "p-[18px]"}>
          <div className="max-w-2xl mx-auto flex flex-col gap-4">
            {isMobile && <div className="text-xl font-bold">Settings</div>}

            {/* TABS */}
            <div className="flex bg-gray-100 rounded-xl p-1 w-fit">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold ${
                    tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                  onClick={() => goToSettingsTab(t.key)}
                >
                  <Icon icon={icons[t.icon]} size={14} />
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "account" && (
              <>
                {/* PROFILE INFORMATION */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-slate-700">
                      <Icon icon={icons.profile} size={16} />
                    </div>
                    <div>
                      <div className="text-base font-bold text-slate-900">Profile Information</div>
                      <div className="text-xs opacity-55">Update your account details</div>
                    </div>
                  </div>

                  <div className={isMobile ? "flex flex-col gap-3" : "grid grid-cols-2 gap-3"}>
                    <div>
                      <div className={labelClass}>First Name</div>
                      <input className={inputClass} defaultValue="Luz Anthony" />
                    </div>
                    <div>
                      <div className={labelClass}>Last Name</div>
                      <input className={inputClass} defaultValue="Miranda" />
                    </div>
                  </div>

                  <div>
                    <div className={labelClass}>Email</div>
                    <input className={inputClass} defaultValue="luimiranda@ecohaulers.com" />
                  </div>

                  <div>
                    <div className={labelClass}>Phone Number</div>
                    <input className={inputClass} placeholder="+63 9xx-xxx-xxx" />
                  </div>

                  <div>
                    <div className={labelClass}>Address</div>
                    <input className={inputClass} placeholder="Address Line, Barangay, City/Municipality, and Province" />
                  </div>

                  <button className="w-fit bg-[#0f2a1f] text-white border-none px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer flex items-center justify-center gap-2">
                    <Icon icon={icons.save} size={15} />
                    Save Changes
                  </button>
                </div>

                {/* OTHER DETAILS */}
                <div className="bg-[#0f2a1f] text-white rounded-2xl p-5">
                  <div className="text-base font-bold mb-4">Other Details</div>
                  <div className={isMobile ? "flex flex-col gap-4" : "grid grid-cols-2 gap-4"}>
                    <div>
                      <div className="text-[11px] font-bold tracking-wide opacity-50 uppercase mb-1">Agency ID</div>
                      <div className="text-sm font-bold">LOGI-WEST-09</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold tracking-wide opacity-50 uppercase mb-1">Truck ID</div>
                      <div className="text-sm font-bold">HVY-449-BC</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold tracking-wide opacity-50 uppercase mb-1">Join Date</div>
                      <div className="text-sm font-bold">12 Oct 2022</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold tracking-wide opacity-50 uppercase mb-1">Last IP Address</div>
                      <div className="text-sm font-bold text-green-400">192.168.1.144</div>
                    </div>
                  </div>
                </div>

                {/* SECURITY */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-slate-700">
                      <Icon icon={icons.shield} size={16} />
                    </div>
                    <div>
                      <div className="text-base font-bold text-slate-900">Security</div>
                      <div className="text-xs opacity-55">Manage your password and security settings</div>
                    </div>
                  </div>

                  <div>
                    <div className={labelClass}>Current Password</div>
                    <input type="password" className={inputClass} />
                  </div>
                  <div>
                    <div className={labelClass}>New Password</div>
                    <input type="password" className={inputClass} />
                  </div>
                  <div>
                    <div className={labelClass}>Confirm New Password</div>
                    <input type="password" className={inputClass} />
                  </div>

                  <button className="w-fit bg-[#0f2a1f] text-white border-none px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer">
                    Update Password
                  </button>
                </div>

                {/* LOG OUT / DELETE ACCOUNT */}
                <div className={isMobile ? "flex flex-col gap-3" : "grid grid-cols-2 gap-3"}>
                  <button
                    className="bg-white border border-gray-200 text-slate-700 rounded-xl py-3 font-bold text-sm cursor-pointer flex items-center justify-center gap-2"
                    onClick={() => setConfirmOpen(true)}
                  >
                    <Icon icon={icons.logout} size={15} />
                    Log Out
                  </button>
                  <button className="bg-red-50 border border-red-200 text-red-600 rounded-xl py-3 font-bold text-sm cursor-pointer flex items-center justify-center gap-2">
                    <Icon icon={icons.trash} size={15} />
                    Delete Account
                  </button>
                </div>
              </>
            )}

            {tab === "notifications" && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 text-sm opacity-60">
                Notification preferences go here.
              </div>
            )}

            {tab === "system" && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 text-sm opacity-60">
                System settings go here.
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

export default Settings;