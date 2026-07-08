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
  { to: "/driver/route", label: "Collection Route" },
  { to: "/driver/history", label: "Route History" },
  { to: "/driver/settings", label: "Settings" },
];

export const ecoAideNavItems: NavItem[] = [
  { to: "/eco-aide", label: "Dashboard", end: true },
  { to: "/eco-aide/route", label: "Hauling Route" },
  { to: "/eco-aide/tasks", label: "Tasks & Queue" },
  { to: "/eco-aide/settings", label: "Settings" },
];

export const residentNavItems: NavItem[] = [
  { to: "/resident", label: "Dashboard", end: true },
  { to: "/resident/track", label: "Track Truck" },
  { to: "/resident/hauling", label: "Hauling Requests" },
  { to: "/resident/schedule", label: "Schedule" },
  { to: "/resident/reports", label: "Reports" },
  { to: "/resident/notifications", label: "Notifications" },
  { to: "/resident/settings", label: "Settings" },
];
