import { Outlet } from "react-router-dom";

// Each driver page (Dashboard, CurrentRoute, Collections, ReportIssue,
// Messages, Settings) already renders its own Header, Sidebar, BottomNav,
// and Fab via features/driver/shared/*. This layout used to also render a
// white top header + a second bottom nav, which duplicated all of that —
// two headers and two nav bars stacked on both desktop and mobile.
//
// Intentionally just a pass-through now. If a driver-wide wrapper is ever
// needed again (route guards, global providers, etc.), add it here without
// rendering any visible chrome — the pages own their own UI.
export function DriverLayout() {
  return <Outlet />;
}

export default DriverLayout;