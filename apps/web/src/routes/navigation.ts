// Central nav config for the admin sidebar. Add a screen here + a matching
// <Route> in App.tsx — nothing else needs to change.

export interface NavItem {
  to: string;
  label: string;
  /** true for the index route so it isn't marked active on every child path */
  end?: boolean;
}

export const adminNavItems: NavItem[] = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/eco-aides", label: "Eco-Aide Management" },
  { to: "/admin/fleet", label: "Fleet Management" },
  { to: "/admin/routes", label: "Route Management" },
  { to: "/admin/hauling", label: "Hauling Request Management" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/notifications", label: "Notifications" },
  { to: "/admin/settings", label: "Settings" },
];

export const driverNavItems: NavItem[] = [
  { to: "/driver", label: "Dashboard", end: true },
  { to: "/driver/route", label: "Current Route" },
  { to: "/driver/collections", label: "Collections" },
  { to: "/driver/report", label: "Report Issue" },
  { to: "/driver/messages", label: "Messages" },
  { to: "/driver/settings", label: "Settings" },
];