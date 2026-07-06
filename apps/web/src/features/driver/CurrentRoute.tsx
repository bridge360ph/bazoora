import { useState, useEffect } from "react";
import type { CSSProperties } from "react";

/* ---------------- ICON PLUMBING (same as Dashboard) ---------------- */
type IconShape = {
  paths: string[];
  circles?: { cx: number; cy: number; r: number }[];
};

const Icon = ({ icon, size = 18 }: { icon: IconShape; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    {icon.paths.map((d, i) => (
      <path key={i} d={d} />
    ))}
    {icon.circles?.map((c, i) => (
      <circle key={i} cx={c.cx} cy={c.cy} r={c.r} />
    ))}
  </svg>
);

const HamburgerIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

/* ---------------- ICON DATA (Dashboard set + Route-page additions) ---------------- */
const icons: Record<string, IconShape> = {
  dashboard: {
    paths: ["M4 13h7v7H4v-7zm0-10h7v7H4V3zm9 0h7v7h-7V3zm0 10h7v7h-7v-7z"],
  },
  route: {
    paths: ["M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"],
    circles: [{ cx: 12, cy: 10, r: 2.5 }],
  },
  collections: {
    paths: [
      "M22 12h-6l-2 3h-4l-2-3H2",
      "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
    ],
  },
  tasks: {
    paths: [
      "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2",
      "M9 4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z",
      "m9 14 2 2 4-4",
    ],
  },
  report: {
    paths: ["M5 3v18", "M5 4h11l-2.5 4L16 12H5"],
  },
  messages: {
    paths: ["M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"],
  },
  settings: {
    paths: [
      "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
    ],
    circles: [{ cx: 12, cy: 12, r: 3 }],
  },
  bell: {
    paths: ["M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9", "M10.3 21a1.94 1.94 0 0 0 3.4 0"],
  },
  flag: {
    paths: ["M5 3v18", "M5 4h11l-2.5 4L16 12H5"],
  },
  check: {
    paths: ["M20 6 9 17l-5-5"],
  },
  home: {
    paths: ["M3 10.5 12 3l9 7.5", "M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"],
  },
  locate: {
    paths: ["M12 2v3", "M12 19v3", "M2 12h3", "M19 12h3"],
    circles: [{ cx: 12, cy: 12, r: 6 }],
  },
  layers: {
    paths: [
      "m12.83 2.18a2 2 0 0 0-1.66 0L3.6 6.08a1 1 0 0 0 0 1.83l7.57 3.44a2 2 0 0 0 1.66 0l7.57-3.44a1 1 0 0 0 0-1.83z",
      "m3.6 12.08 7.57 3.44a2 2 0 0 0 1.66 0l7.57-3.44",
      "m3.6 16.08 7.57 3.44a2 2 0 0 0 1.66 0l7.57-3.44",
    ],
  },
  turnRight: {
    paths: ["M15 14 20 9l-5-5", "M4 20v-7a4 4 0 0 1 4-4h12"],
  },
  bin: {
    paths: [
      "M3 6h18",
      "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
      "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6",
    ],
  },
  bookmark: {
    paths: ["M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"],
  },
  pin: {
    paths: ["M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"],
    circles: [{ cx: 12, cy: 10, r: 2.5 }],
  },
  document: {
    paths: ["M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z", "M13 2v7h7"],
  },
  profile: {
    paths: ["M20 21a8 8 0 0 0-16 0"],
    circles: [{ cx: 12, cy: 7, r: 4 }],
  },
  close: {
    paths: ["M18 6 6 18", "M6 6l12 12"],
  },
};

/* ---------------- NAV (identical keys/order to Dashboard) ---------------- */
const navItems = [
  { key: "dashboard", label: "Dashboard", icon: icons.dashboard },
  { key: "route", label: "Route", icon: icons.route },
  { key: "collections", label: "Collections", icon: icons.collections },
  { key: "tasks", label: "Assigned Tasks", icon: icons.tasks },
  { key: "report", label: "Report Issue", icon: icons.report },
  { key: "messages", label: "Messages", icon: icons.messages },
];

// Mobile bottom nav — capped at 4 primary buttons. Messages lives in the FAB
// alongside Profile instead of taking a 5th tab slot.
const mobileNavItems = [
  { key: "dashboard", label: "Home", icon: icons.home },
  { key: "route", label: "My Route", icon: icons.route },
  { key: "tasks", label: "Logs", icon: icons.tasks },
  { key: "report", label: "Report", icon: icons.report },
];

function NavList({
  activeKey,
  onNavigate,
}: {
  activeKey: string;
  onNavigate?: (key: string) => void;
}) {
  return (
    <div style={{ marginTop: 18 }}>
      {navItems.map((item) => (
        <div
          key={item.key}
          style={item.key === activeKey ? navItemActive : navItem}
          onClick={() => onNavigate?.(item.key)}
        >
          <Icon icon={item.icon} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- DATA ---------------- */
type StopStatus = "DONE" | "NOW" | "IN_PROGRESS" | "UPCOMING";

const schedule: { name: string; subtitle: string; status: StopStatus; badge?: string }[] = [
  {
    name: "Sitio Malakas, Brgy. San Rafael",
    subtitle: "12 households • Residential Area",
    status: "DONE",
    badge: "DONE • 08:30 AM",
  },
  {
    name: "Purok 7, Brgy. San Rafael",
    subtitle: "Industrial Park Hub • Warehouse A",
    status: "NOW",
    badge: "NOW",
  },
  {
    name: "Purok 12, Brgy. Manggahan",
    subtitle: "8 households • Commercial Strip",
    status: "IN_PROGRESS",
    badge: "IN PROGRESS",
  },
  {
    name: "Sitio Pag-asa, Brgy. Biela",
    subtitle: "20 households • Village Block",
    status: "UPCOMING",
  },
];

const MOBILE_BREAKPOINT = 680;

/* ---------------- COMPONENT ---------------- */
export function CurrentRoute({ onNavigate }: { onNavigate?: (key: string) => void }) {
  const activeKey = "route";
  const activeMobileKey = "route";

  const [isMobile, setIsMobile] = useState(false);
  // Sidebar drawer is desktop-only — mobile relies entirely on the bottom
  // nav + FAB, no hamburger/drawer at all.
  const [navOpen, setNavOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const goTo = (key: string) => {
    onNavigate?.(key);
    setNavOpen(false);
    setFabOpen(false);
  };

  const sidebarInner = (
    <>
      <div>
        <div style={logo}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>🚛 BAZOORA</div>
          <div style={{ fontSize: 10, opacity: 0.6 }}>DRIVER</div>
        </div>
        <NavList activeKey={activeKey} onNavigate={goTo} />
      </div>

      <div style={sidebarBottom}>
        <div style={avatar}>JD</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>John Doe</div>
          <div style={{ fontSize: 11, opacity: 0.6 }}>Unit #4029</div>
        </div>
        <div style={{ opacity: 0.7, cursor: "pointer" }}>
          <Icon icon={icons.settings} />
        </div>
      </div>
    </>
  );

  return (
    <div style={layout}>
      {/* NAV DRAWER — desktop only. Mobile uses button-based navigation
          (bottom nav + FAB) instead of a sidebar. */}
      {!isMobile && navOpen && (
        <>
          <div style={drawerBackdrop} onClick={() => setNavOpen(false)} />
          <aside style={drawerPanel}>{sidebarInner}</aside>
        </>
      )}

      <div style={mainWrap}>
        <header style={header}>
          <div
            style={leftHeader}
            onClick={() => {
              if (!isMobile) setNavOpen((v) => !v);
            }}
          >
            {!isMobile && <HamburgerIcon />}
          </div>

          <div style={headerTitle}>{isMobile ? "BAZOORA" : "Route"}</div>

          <div style={rightHeader}>
            <div style={bellWrap}>
              <Icon icon={icons.bell} />
            </div>
            {/* Profile lives in the mobile FAB, so the header avatar is
                desktop-only. */}
            {!isMobile && <div style={topAvatar}>JD</div>}
          </div>
        </header>

        <main style={{ ...content, padding: isMobile ? 14 : 18, paddingBottom: isMobile ? 96 : 18 }}>
          <div style={isMobile ? routeGridMobile : routeGrid}>
            <div style={leftCol}>
              <div style={mapCard}>
                <div style={mapLabel}>Map View</div>

                <div style={mapPlaceholder}>
                  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line x1="8" y1="8" x2="92" y2="92" stroke="#e2e6e3" strokeWidth={2} />
                    <line x1="92" y1="8" x2="8" y2="92" stroke="#e2e6e3" strokeWidth={2} />
                    <rect x="8" y="8" width="84" height="84" fill="none" stroke="#e2e6e3" strokeWidth={2} />
                  </svg>
                </div>

                <div style={mapControls}>
                  <div style={mapControlBtn}>
                    <Icon icon={icons.locate} size={18} />
                  </div>
                  <div style={mapControlBtn}>
                    <Icon icon={icons.layers} size={18} />
                  </div>
                </div>

                <div style={turnBanner}>
                  <div style={turnIconWrap}>
                    <Icon icon={icons.turnRight} size={18} />
                  </div>
                  <div>
                    <div style={turnMeta}>IN 450 METERS</div>
                    <div style={turnTitle}>Turn Right onto Industrial Parkway</div>
                  </div>
                </div>
              </div>

              <div style={isMobile ? infoRowMobile : infoRow}>
                <div style={infoCard}>
                  <div style={infoEyebrow}>ROUTE OVERVIEW</div>
                  <div style={infoTitle}>Route 1 - 12.4 km</div>
                  <div style={infoLine}>
                    <Icon icon={icons.pin} size={15} />
                    <span>Purok 7, Brgy. San Rafael, General Trias</span>
                  </div>
                  <div style={infoSubtle}>2.8 km from last collection point</div>
                </div>

                <div style={infoCard}>
                  <div style={infoEyebrow}>DESTINATION POINT</div>
                  <div style={destRow}>
                    <div style={destIconWrap}>
                      <Icon icon={icons.bin} size={18} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={destTitle}>Industrial Park Hub</div>
                      <div style={infoSubtle}>Purok 12, Brgy. Manggahan, Cavite</div>
                    </div>
                  </div>
                  <div style={destTimeRow}>
                    <span style={destTimeLabel}>GENERAL ETC</span>
                    <span style={destTime}>01:05 PM</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={scheduleCol}>
              <div style={scheduleHeader}>
                <div
                  style={{ ...scheduleTitle, cursor: "pointer" }}
                  onClick={() => goTo("dashboard")}
                  title="Back to Dashboard"
                >
                  Daily Schedule
                </div>
                <div style={infoSubtle}>14 Collections • 3.2 tons est.</div>
              </div>

              <div style={scheduleList}>
                {schedule.map((s, i) => {
                  const isNow = s.status === "NOW";
                  return (
                    <div key={i} style={isNow ? scheduleItemActive : scheduleItem}>
                      <div style={isNow ? stopNumberActive : stopNumber}>
                        {String(i + 1).padStart(2, "0")}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={stopTopRow}>
                          <div style={isNow ? stopNameLight : stopName}>{s.name}</div>
                          {s.badge && (
                            <div
                              style={
                                s.status === "DONE"
                                  ? badgeDone
                                  : s.status === "NOW"
                                  ? badgeNow
                                  : badgeProgress
                              }
                            >
                              {s.status === "NOW" && <Icon icon={icons.bookmark} size={11} />}
                              {s.badge}
                            </div>
                          )}
                        </div>
                        <div style={isNow ? stopSubtitleLight : stopSubtitle}>{s.subtitle}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={scheduleActions}>
                <button style={btnGreen} onClick={() => goTo("dashboard")}>
                  <Icon icon={icons.check} />
                  Mark as Complete
                </button>
                <button style={btnRed}>
                  <Icon icon={icons.document} />
                  Report Issue at this Stop
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* BOTTOM NAV (mobile) — max 4 primary buttons */}
      {isMobile && (
        <nav style={bottomNav}>
          {mobileNavItems.map((item) => (
            <div
              key={item.key}
              style={item.key === activeMobileKey ? bottomNavItemActive : bottomNavItem}
              onClick={() => goTo(item.key)}
            >
              <Icon icon={item.icon} size={20} />
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
      )}

      {/* FAB (mobile) — Messages + Profile live here instead of crowding the
          bottom nav or the header. Sits bottom-LEFT so it never covers the
          right-aligned status pill / "Details ›" content. */}
      {isMobile && (
        <div style={fabWrap}>
          {fabOpen && (
            <div style={fabActions}>
              <button style={fabActionBtn} onClick={() => goTo("profile")}>
                <Icon icon={icons.profile} size={16} />
                <span>Profile</span>
              </button>
              <button style={fabActionBtn} onClick={() => goTo("messages")}>
                <Icon icon={icons.messages} size={16} />
                <span>Messages</span>
              </button>
            </div>
          )}

          <button
            style={fabMain}
            onClick={() => setFabOpen((v) => !v)}
            aria-label="Quick actions"
          >
            <Icon icon={fabOpen ? icons.close : icons.messages} size={22} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- LAYOUT (identical tokens to Dashboard) ---------------- */
const layout: CSSProperties = {
  display: "flex",
  height: "100vh",
  background: "#f3f6f4",
  fontFamily: "Inter, sans-serif",
  position: "relative",
};

const sidebar: CSSProperties = {
  width: 230,
  background: "#0f2a1f",
  color: "white",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: 14,
};

const logo: CSSProperties = { marginBottom: 10 };

const navItem: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 8px",
  fontSize: 13,
  opacity: 0.65,
  borderRadius: 10,
  cursor: "pointer",
};

const navItemActive: CSSProperties = {
  ...navItem,
  opacity: 1,
  fontWeight: 700,
  background: "rgba(255,255,255,0.1)",
};

const sidebarBottom: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  paddingTop: 14,
  borderTop: "1px solid rgba(255,255,255,0.1)",
};

const avatar: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: "50%",
  background: "#e0983f",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: 13,
  flexShrink: 0,
};

const drawerBackdrop: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  zIndex: 30,
};

const drawerPanel: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  bottom: 0,
  width: 230,
  background: "#0f2a1f",
  color: "white",
  padding: 14,
  zIndex: 31,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

const mainWrap: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  overflowY: "auto",
};

const header: CSSProperties = {
  height: 60,
  background: "#0f2a1f",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 18px",
  flexShrink: 0,
};

const leftHeader: CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
};

const headerTitle: CSSProperties = {
  flex: 1,
  textAlign: "center",
  fontWeight: 800,
};

const rightHeader: CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 12,
};

const bellWrap: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.12)",
};

const topAvatar: CSSProperties = avatar;

const content: CSSProperties = {
  padding: 18,
};

const btnGreen: CSSProperties = {
  background: "#4ade80",
  border: "none",
  padding: "14px 16px",
  borderRadius: 12,
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const btnRed: CSSProperties = {
  background: "#dc2626",
  border: "none",
  padding: "14px 16px",
  borderRadius: 12,
  color: "white",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const bottomNav: CSSProperties = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  height: 64,
  background: "#0f2a1f",
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
  borderTop: "1px solid rgba(255,255,255,0.08)",
  zIndex: 20,
};

const bottomNavItem: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  color: "rgba(255,255,255,0.6)",
  fontSize: 10,
  fontWeight: 600,
  cursor: "pointer",
};

const bottomNavItemActive: CSSProperties = {
  ...bottomNavItem,
  color: "#ffffff",
};

/* ---------------- FAB (mobile — Messages + Profile) ---------------- */
const fabWrap: CSSProperties = {
  position: "fixed",
  left: 18,
  bottom: 84,
  zIndex: 25,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
};

const fabActions: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 10,
  marginBottom: 12,
};

const fabActionBtn: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "#fff",
  color: "#0f2a1f",
  border: "1px solid #e5e7eb",
  borderRadius: 999,
  padding: "10px 16px",
  fontSize: 13,
  fontWeight: 700,
  boxShadow: "0 6px 16px rgba(0,0,0,0.14)",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const fabMain: CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: 18,
  background: "#0f2a1f",
  color: "#fff",
  border: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 8px 20px rgba(0,0,0,0.28)",
  cursor: "pointer",
};

/* ---------------- ROUTE PAGE SPECIFIC TOKENS ---------------- */
const routeGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 340px",
  gap: 16,
  alignItems: "start",
};

const routeGridMobile: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const leftCol: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  minWidth: 0,
};

const mapCard: CSSProperties = {
  position: "relative",
  background: "#eef1ef",
  borderRadius: 16,
  border: "1px solid #e5e7eb",
  padding: 14,
  height: 480,
  display: "flex",
  flexDirection: "column",
};

const mapLabel: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#334155",
  marginBottom: 10,
};

const mapPlaceholder: CSSProperties = {
  flex: 1,
  borderRadius: 12,
  overflow: "hidden",
  background: "#eef1ef",
};

const mapControls: CSSProperties = {
  position: "absolute",
  top: 54,
  right: 22,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const mapControlBtn: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: "50%",
  background: "#fff",
  boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#0f2a1f",
  cursor: "pointer",
};

const turnBanner: CSSProperties = {
  position: "absolute",
  left: 22,
  right: 22,
  bottom: 22,
  background: "#0f2a1f",
  color: "#fff",
  borderRadius: 14,
  padding: "14px 16px",
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const turnIconWrap: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 10,
  background: "rgba(255,255,255,0.15)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const turnMeta: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.4,
  opacity: 0.7,
  marginBottom: 2,
  textTransform: "uppercase",
};

const turnTitle: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
};

const infoRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
};

const infoRowMobile: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const infoCard: CSSProperties = {
  background: "#fff",
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  padding: 16,
  minWidth: 0,
};

const infoEyebrow: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.4,
  opacity: 0.5,
  marginBottom: 8,
};

const infoTitle: CSSProperties = {
  fontSize: 17,
  fontWeight: 800,
  marginBottom: 10,
};

const infoLine: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 6,
  fontSize: 13,
  color: "#334155",
  marginBottom: 6,
};

const infoSubtle: CSSProperties = {
  fontSize: 12,
  opacity: 0.55,
};

const destRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 14,
};

const destIconWrap: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 10,
  background: "#dcfce7",
  color: "#166534",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const destTitle: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
};

const destTimeRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: 12,
  borderTop: "1px solid #f3f4f6",
};

const destTimeLabel: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  opacity: 0.5,
  letterSpacing: 0.4,
};

const destTime: CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
};

const scheduleCol: CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  border: "1px solid #e5e7eb",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  height: "100%",
};

const scheduleHeader: CSSProperties = {
  padding: "18px 18px 12px",
  borderBottom: "1px solid #f3f4f6",
};

const scheduleTitle: CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  marginBottom: 4,
};

const scheduleList: CSSProperties = {
  padding: "10px 14px",
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const scheduleItem: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  padding: "12px",
  borderRadius: 14,
};

const scheduleItemActive: CSSProperties = {
  ...scheduleItem,
  background: "#0f2a1f",
};

const stopNumber: CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: "50%",
  background: "#e5e7eb",
  color: "#475569",
  fontSize: 11,
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const stopNumberActive: CSSProperties = {
  ...stopNumber,
  background: "#4ade80",
  color: "#0f2a1f",
};

const stopTopRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 8,
};

const stopName: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#0f172a",
};

const stopNameLight: CSSProperties = {
  ...stopName,
  color: "#fff",
};

const stopSubtitle: CSSProperties = {
  fontSize: 12,
  opacity: 0.55,
  marginTop: 2,
};

const stopSubtitleLight: CSSProperties = {
  ...stopSubtitle,
  color: "#fff",
  opacity: 0.7,
};

const badgeBase: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  padding: "4px 8px",
  borderRadius: 999,
  whiteSpace: "nowrap",
  display: "flex",
  alignItems: "center",
  gap: 4,
  flexShrink: 0,
};

const badgeDone: CSSProperties = {
  ...badgeBase,
  background: "#dcfce7",
  color: "#166534",
};

const badgeNow: CSSProperties = {
  ...badgeBase,
  background: "#fff",
  color: "#0f2a1f",
};

const badgeProgress: CSSProperties = {
  ...badgeBase,
  background: "#ffedd5",
  color: "#9a3412",
};

const scheduleActions: CSSProperties = {
  marginTop: "auto",
  padding: 14,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  borderTop: "1px solid #f3f4f6",
};
