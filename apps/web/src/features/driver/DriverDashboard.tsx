import { useState, useEffect } from "react";
import type { CSSProperties } from "react";

/* ---------------- ICON PLUMBING ---------------- */
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

/* ---------------- ICON DATA (fixed/verified shapes) ---------------- */
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
};

/* ---------------- NAV ---------------- */
// key === the page id it should navigate to. Only "dashboard" and "route" have
// real pages right now; the rest will highlight on click but onNavigate just
// won't match a page for them until those pages exist.
const navItems = [
  { key: "dashboard", label: "Dashboard", icon: icons.dashboard },
  { key: "route", label: "Route", icon: icons.route },
  { key: "collections", label: "Collections", icon: icons.collections },
  { key: "tasks", label: "Assigned Tasks", icon: icons.tasks },
  { key: "report", label: "Report Issue", icon: icons.report },
  { key: "messages", label: "Messages", icon: icons.messages },
];

const mobileNavItems = [
  { key: "dashboard", label: "Home", icon: icons.home },
  { key: "route", label: "My Route", icon: icons.route },
  { key: "tasks", label: "Logs", icon: icons.tasks },
  { key: "report", label: "Report", icon: icons.report },
  { key: "messages", label: "Messages", icon: icons.messages },
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

const MOBILE_BREAKPOINT = 680;

/* ---------------- COMPONENT ---------------- */
// onNavigate: call this with "dashboard" | "route" (or any nav key) to switch pages.
// Whatever renders <DriverDashboard /> is responsible for holding page state and
// swapping in <DriverRoute /> (or whichever component) when this fires.
function DriverDashboard({ onNavigate }: { onNavigate?: (key: string) => void }) {
  const completed = 8;
  const total = 14;
  const progress = (completed / total) * 100;
  const activeKey = "dashboard";
  const activeMobileKey = "dashboard";

  const [isMobile, setIsMobile] = useState(false);
  const [navOpen, setNavOpen] = useState(true);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const goTo = (key: string) => {
    onNavigate?.(key);
    if (isMobile) setNavOpen(false);
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
      {/* SIDEBAR (desktop) */}
      {!isMobile && navOpen && <aside style={sidebar}>{sidebarInner}</aside>}

      {/* MOBILE DRAWER (opened via hamburger) */}
      {isMobile && navOpen && (
        <>
          <div style={drawerBackdrop} onClick={() => setNavOpen(false)} />
          <aside style={drawerPanel}>{sidebarInner}</aside>
        </>
      )}

      {/* MAIN */}
      <div style={mainWrap}>
        <header style={header}>
          <div style={leftHeader} onClick={() => setNavOpen((v) => !v)}>
            <HamburgerIcon />
          </div>

          <div style={headerTitle}>{isMobile ? "BAZOORA" : "Dashboard"}</div>

          <div style={rightHeader}>
            <div style={bellWrap}>
              <Icon icon={icons.bell} />
            </div>
            <div style={topAvatar}>JD</div>
          </div>
        </header>

        <main style={{ ...content, padding: isMobile ? 14 : 18, paddingBottom: isMobile ? 84 : 18 }}>
          {/* TOP CARDS */}
          <div style={isMobile ? topCardsMobile : topCards}>
            <div style={{ ...smallCard, ...(isMobile ? { gridColumn: "1 / -1" } : {}) }}>
              <div style={smallLabel}>Today's Route</div>
              <div style={smallValue}>Route 1</div>
            </div>

            <div style={smallCardRow}>
              <div style={{ minWidth: 0 }}>
                <div style={smallLabel}>Stops Completed</div>
                <div style={smallValue}>
                  {completed}/{total}
                </div>
              </div>
              <div style={pillOrangeSmall}>IN PROGRESS</div>
            </div>

            <div style={smallCardRow}>
              <div style={{ minWidth: 0 }}>
                <div style={smallLabel}>Assigned Truck</div>
                <div style={smallValue}>BT-04</div>
              </div>
              <div style={pillGreenSmall}>ACTIVE • GPS ON</div>
            </div>
          </div>

          {/* GRID */}
          <div style={isMobile ? grid2Mobile : grid2}>
            {/* CURRENT STOP */}
            <div style={{ ...currentStopCard, height: isMobile ? "auto" : 312 }}>
              <div style={currentTopRow}>
                <div style={currentLabel}>CURRENT STOP</div>
                <div style={pillOrange}>IN PROGRESS</div>
              </div>

              <div style={currentTitle}>Sitio Malaya — Stop 9</div>

              <div style={currentSub}>Purok 3, Barangay Poblacion • Biodegradable</div>

              <button style={btnGreen}>
                <Icon icon={icons.check} />
                Mark as Complete
              </button>
              <button style={btnRed} onClick={() => goTo("route")}>
                <Icon icon={icons.flag} />
                Report Issue at this Stop
              </button>
            </div>

            {/* ROUTE PROGRESS */}
            <div style={{ ...routeCard, height: isMobile ? "auto" : 312 }}>
              <div style={routeCardHeader}>
                <div
                  style={{ ...routeHeader, cursor: "pointer" }}
                  onClick={() => goTo("route")}
                  title="Go to Route"
                >
                  Route Progress
                </div>

                <div style={bar}>
                  <div style={{ width: `${progress}%`, height: "100%", background: "#1e3a8a" }} />
                </div>

                <div style={row}>
                  <span>{completed} Completed</span>
                  <span>{total - completed} Remaining</span>
                </div>
              </div>

              <div
                style={{
                  ...routeScrollArea,
                  overflowY: isMobile ? "visible" : "auto",
                  flex: isMobile ? ("unset" as const) : 1,
                }}
              >
                {routeStops.map((s, i) => (
                  <div key={i} style={routeItem}>
                    <div
                      style={{
                        width: 4,
                        alignSelf: "stretch",
                        background:
                          s.status === "COMPLETED" ? "#22c55e" : s.status === "REPORTED" ? "#ef4444" : "#f59e0b",
                        borderRadius: 4,
                      }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={dateStamp}>{s.date}</div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                      <div style={{ fontSize: 12, opacity: 0.6 }}>{s.subtitle}</div>
                    </div>

                    <div style={statusColumn}>
                      <div
                        style={{
                          padding: "4px 10px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          background:
                            s.status === "COMPLETED" ? "#dcfce7" : s.status === "REPORTED" ? "#fee2e2" : "#ffedd5",
                          color:
                            s.status === "COMPLETED" ? "#166534" : s.status === "REPORTED" ? "#991b1b" : "#9a3412",
                        }}
                      >
                        {s.status}
                      </div>

                      <div
                        style={{ fontSize: 12, fontWeight: 700, opacity: 0.7, cursor: "pointer" }}
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

      {/* BOTTOM NAV (mobile) */}
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
    </div>
  );
}

/* ---------------- LAYOUT ---------------- */
const grid2: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
};

const grid2Mobile: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const layout: CSSProperties = {
  display: "flex",
  height: "100vh",
  background: "#f3f6f4",
  fontFamily: "Inter, sans-serif",
  position: "relative",
};

/* ---------------- SIDEBAR ---------------- */
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

/* ---------------- MOBILE DRAWER ---------------- */
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

/* ---------------- HEADER ---------------- */
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

/* ---------------- CONTENT ---------------- */
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

/* ---------------- CURRENT STOP ---------------- */
const currentStopCard: CSSProperties = {
  background: "#003d1f",
  color: "white",
  borderRadius: 14,
  padding: "18px 22px",
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const currentTopRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const currentLabel: CSSProperties = {
  fontSize: 13,
  opacity: 0.8,
};

const currentTitle: CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  lineHeight: 1.2,
};

const currentSub: CSSProperties = {
  opacity: 0.85,
  fontSize: 13,
  lineHeight: 1.5,
};

const pillOrange: CSSProperties = {
  background: "#ffedd5",
  color: "#9a3412",
  padding: "6px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
};

const btnGreen: CSSProperties = {
  background: "#4ade80",
  border: "none",
  padding: "12px 16px",
  borderRadius: 10,
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const btnRed: CSSProperties = {
  background: "#dc2626",
  border: "none",
  padding: "12px 16px",
  borderRadius: 10,
  color: "white",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

/* ---------------- ROUTE PROGRESS ---------------- */
const routeCard: CSSProperties = {
  background: "white",
  borderRadius: 18,
  border: "1px solid #e5e7eb",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const routeCardHeader: CSSProperties = {
  padding: "18px 18px 12px",
  background: "#fff",
  borderBottom: "1px solid #f3f4f6",
  flexShrink: 0,
};

const routeHeader: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  marginBottom: 12,
};

const bar: CSSProperties = {
  height: 10,
  background: "#e5e7eb",
  borderRadius: 999,
  overflow: "hidden",
};

const row: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 13,
  marginTop: 8,
};

const routeScrollArea: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "0 18px",
};

const routeItem: CSSProperties = {
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

const statusColumn: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 6,
  flexShrink: 0,
};

/* ---------------- BOTTOM NAV (mobile) ---------------- */
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

export default DriverDashboard;
