import {
  DashboardIcon,
  EcoAideIcon,
  FleetManagementIcon,
  RouteManagementIcon,
  HaulingRequestManagementIcon,
  AnalyticsIcon,
  NotificationsIcon,
  SettingsIcon,
} from "@bazoora/ui";

// CENTRAL NAV CONFIGS. ADD A SCREEN HERE + A MATCHING <ROUTE> IN APP.TSX.
export interface NavItem {
  to: string;
  label: string;

  /** TRUE FOR THE INDEX ROUTE SO IT ISN'T MARKED ACTIVE ON EVERY CHILD PATH */
  end?: boolean;
  icon?: string;
}

export const adminNavItems: NavItem[] = [
  {
    to: "/admin",
    label: "Dashboard",
    end: true,
    icon: DashboardIcon,
  },
  {
    to: "/admin/eco-aides",
    label: "Eco-Aide Management",
    icon: EcoAideIcon,
  },
  {
    to: "/admin/fleet",
    label: "Fleet Management",
    icon: FleetManagementIcon,
  },
  {
    to: "/admin/routes",
    label: "Route Management",
    icon: RouteManagementIcon,
  },
  {
    to: "/admin/hauling",
    label: "Hauling Request Management",
    icon: HaulingRequestManagementIcon,
  },
  {
    to: "/admin/analytics",
    label: "Analytics",
    icon: AnalyticsIcon,
  },
  {
    to: "/admin/notifications",
    label: "Notifications",
    icon: NotificationsIcon,
  },
  {
    to: "/admin/settings",
    label: "Settings",
    icon: SettingsIcon,
  },
];

export const driverNavItems: NavItem[] = [
  { to: "/driver", label: "Dashboard", end: true },
  { to: "/driver/route", label: "Collection Route" },
  { to: "/driver/collections", label: "Collections" },
];

export const ecoAideNavItems: NavItem[] = [
  { to: "/eco-aide", label: "Dashboard", end: true },
  { to: "/eco-aide/route", label: "Route" },
  { to: "/eco-aide/collections", label: "Collections" },
  { to: "/eco-aide/tasks", label: "Assigned Tasks" },
  { to: "/eco-aide/report-issue", label: "Report Issue" },
  { to: "/eco-aide/messages", label: "Messages" },
];

export const residentNavItems: NavItem[] = [
  { to: "/resident/track", label: "Track Truck" },
];