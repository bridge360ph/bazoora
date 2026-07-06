import { useState, useEffect } from "react";
import type { CSSProperties } from "react";

/* ---------------- ICON PLUMBING (same as Dashboard/Route) ---------------- */
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

/* ---------------- ICON DATA (Dashboard/Route set + Collections additions) ---------------- */
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
  alert: {
    paths: ["M12 8v5", "M12 16.5v.5"],
    circles: [{ cx: 12, cy: 12, r: 9 }],
  },
  download: {
    paths: ["M12 3v12", "m7 10 5 5 5-5", "M5 21h14"],
  },
  profile: {
    paths: ["M20 21a8 8 0 0 0-16 0"],
    circles: [{ cx: 12, cy: 7, r: 4 }],
  },
  close: {
    paths: ["M18 6 6 18", "M6 6l12 12"],
  },
};

/* ---------------- NAV (identical keys/order to Dashboard/Route) ---------------- */
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

const MOBILE_BREAKPOINT = 680;

/* ---------------- COMPONENT ---------------- */
export function CollectionsPage({ onNavigate }: { onNavigate?: (key: string) => void }) {
  const activeKey = "collections";
  // No dedicated mobile bottom-nav slot for Collections (same as Assigned
  // Tasks) — falls back to no highlighted item.
  const activeMobileKey = "collections";

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

          <div style={headerTitle}>{isMobile ? "BAZOORA" : "Collections"}</div>

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
          {/* TOP SUMMARY CARDS */}
          <div style={isMobile ? topCardsMobile : topCards}>
            <div style={smallCardRow}>
              <div style={{ minWidth: 0 }}>
                <div style={smallLabel}>Collections Today</div>
                <div style={smallValue}>8</div>
              </div>
              <div style={pillGreenSmall}>COMPLETED</div>
            </div>

            <div style={smallCardRow}>
              <div style={{ minWidth: 0 }}>
                <div style={smallLabel}>Issues Reported</div>
                <div style={smallValue}>1</div>
              </div>
              <div style={pillOrangeSmall}>IN PROGRESS</div>
            </div>

            <div style={{ ...smallCard, ...(isMobile ? { gridColumn: "1 / -1" } : {}) }}>
              <div style={smallLabel}>Waste Collected</div>
              <div style={rowBetween}>
                <div style={smallValue}>1.4t</div>
                <div style={estimatedLabel}>Estimated</div>
              </div>
            </div>
          </div>

          {/* COLLECTION LOG */}
          <div style={logCard}>
            <div style={logHeaderRow}>
              <div style={logTitle}>Collection Log</div>
              <div style={exportLink}>
                <Icon icon={icons.download} size={14} />
                Export CSV
              </div>
            </div>

            <div style={logList}>
              {collectionLog.map((entry, i) => (
                <div key={i} style={logItem}>
                  <div
                    style={{
                      width: 4,
                      alignSelf: "stretch",
                      background:
                        entry.status === "COMPLETED"
                          ? "#22c55e"
                          : entry.status === "REPORTED"
                          ? "#ef4444"
                          : "#f59e0b",
                      borderRadius: 4,
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={dateStamp}>{entry.date}</div>
                    <div style={logName}>{entry.name}</div>
                    <div style={logSubtitle}>{entry.subtitle}</div>
                  </div>

                  {entry.status === "PENDING" ? (
                    <div style={actionRow}>
                      <div
                        style={actionBtnGreen}
                        title="Mark as complete"
                        onClick={() => {
                          /* wire up to real completion state when the backend exists */
                        }}
                      >
                        <Icon icon={icons.check} size={16} />
                      </div>
                      <div
                        style={actionBtnRed}
                        title="Report an issue"
                        onClick={() => goTo("route")}
                      >
                        <Icon icon={icons.alert} size={16} />
                      </div>
                    </div>
                  ) : (
                    <div style={statusColumn}>
                      <div
                        style={{
                          padding: "4px 10px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          background: entry.status === "COMPLETED" ? "#dcfce7" : "#fee2e2",
                          color: entry.status === "COMPLETED" ? "#166534" : "#991b1b",
                        }}
                      >
                        {entry.status}
                      </div>

                      <div style={detailsLink} onClick={() => goTo("route")}>
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
          right-aligned status pill / "Details ›" content in the log. */}
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

/* ---------------- LAYOUT (identical tokens to Dashboard/Route) ---------------- */
const layout: CSSProperties = {
  display: "flex",
  height: "100vh",
  background: "#f3f6f4",
  fontFamily: "Inter, sans-serif",
  position: "relative",
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

const topCards: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 12,
  marginBottom: 16,
};

const topCardsMobile: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
  marginBottom: 16,
};

const smallCard: CSSProperties = {
  background: "white",
  borderRadius: 14,
  padding: 14,
  border: "1px solid #e5e7eb",
  minWidth: 0,
};

const smallCardRow: CSSProperties = {
  background: "white",
  borderRadius: 14,
  padding: 14,
  border: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  minWidth: 0,
};

const smallLabel: CSSProperties = {
  fontSize: 12,
  opacity: 0.6,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const smallValue: CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
};

const rowBetween: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
};

const estimatedLabel: CSSProperties = {
  fontSize: 11,
  opacity: 0.5,
  fontStyle: "italic",
};

const pillOrangeSmall: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  background: "#ffedd5",
  color: "#9a3412",
  padding: "4px 10px",
  borderRadius: 999,
  flexShrink: 0,
};

const pillGreenSmall: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  background: "#dcfce7",
  color: "#166534",
  padding: "4px 10px",
  borderRadius: 999,
  flexShrink: 0,
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

/* ---------------- COLLECTIONS PAGE SPECIFIC TOKENS ---------------- */
const logCard: CSSProperties = {
  background: "white",
  borderRadius: 18,
  border: "1px solid #e5e7eb",
  overflow: "hidden",
};

const logHeaderRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "18px 18px 12px",
  borderBottom: "1px solid #f3f4f6",
};

const logTitle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
};

const exportLink: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  fontWeight: 700,
  opacity: 0.65,
  cursor: "pointer",
  fontStyle: "italic",
};

const logList: CSSProperties = {
  padding: "0 18px",
};

const logItem: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "14px 0",
  borderBottom: "1px solid #f3f4f6",
  minHeight: 64,
};

const dateStamp: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.3,
  opacity: 0.45,
  marginBottom: 2,
  textTransform: "uppercase",
};

const logName: CSSProperties = {
  fontWeight: 600,
  fontSize: 14,
};

const logSubtitle: CSSProperties = {
  fontSize: 12,
  opacity: 0.6,
};

const statusColumn: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 6,
  flexShrink: 0,
};

const detailsLink: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  opacity: 0.7,
  cursor: "pointer",
};

const actionRow: CSSProperties = {
  display: "flex",
  gap: 8,
  flexShrink: 0,
};

const actionBtnGreen: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 10,
  background: "#003d1f",
  color: "#4ade80",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const actionBtnRed: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 10,
  background: "#dc2626",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};
