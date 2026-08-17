import { icons } from "./iconData";

/* Desktop sidebar nav — identical order/keys across every page.
   "Route" and "Assigned Tasks" are merged: the Route page's Daily
   Schedule panel now carries the priority/waste-type detail that used to
   live on a separate Assigned Tasks screen, so there's no standalone
   "tasks" entry anymore. Collections stays its own page. */
export const navItems = [
  { key: "dashboard", label: "Dashboard", icon: icons.dashboard },
  { key: "route", label: "Route", icon: icons.route },
  { key: "collections", label: "Collections", icon: icons.collections },
  { key: "report", label: "Report Issue", icon: icons.report },
];

// Mobile bottom nav — capped at 4 primary buttons. Messages lives in the FAB
// alongside Profile instead of taking a 5th tab slot.
export const mobileNavItems = [
  { key: "dashboard", label: "Home", icon: icons.home },
  { key: "route", label: "My Route", icon: icons.route },
  { key: "collections", label: "Logs", icon: icons.collections },
  { key: "report", label: "Report", icon: icons.report },
];