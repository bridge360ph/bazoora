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

// Central nav configs. Add a screen here + a matching <Route> in App.tsx.
export interface NavItem {
  to: string;
  label: string;
  /** true for the index route so it isn't marked active on every child path */
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
  { to: "/eco-aide/route", label: "Hauling Route" },
];

export const residentNavItems: NavItem[] = [
  { to: "/resident/track", label: "Track Truck" },
];
