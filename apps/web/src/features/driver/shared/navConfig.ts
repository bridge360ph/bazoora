import { icons } from "./iconData";

/* Desktop sidebar nav — identical order/keys across every page. */
export const navItems = [
  { key: "dashboard", label: "Dashboard", icon: icons.dashboard },
  { key: "route", label: "Route", icon: icons.route },
  { key: "collections", label: "Logs", icon: icons.collections },
  { key: "tasks", label: "Assigned Tasks", icon: icons.tasks },
  { key: "report", label: "Report Issue", icon: icons.report },
  { key: "messages", label: "Messages", icon: icons.messages },
];

// Mobile bottom nav — capped at 4 primary buttons. Messages lives in the FAB
// alongside Profile instead of taking a 5th tab slot.
//
// "Logs" now points at the "collections" key (the actual Collections page,
// i.e. the pickup log) instead of "tasks" — "tasks" has no screen yet, so
// goTo() was silently no-op'ing and the button did nothing on mobile.
export const mobileNavItems = [
  { key: "dashboard", label: "Home", icon: icons.home },
  { key: "route", label: "My Route", icon: icons.route },
  { key: "collections", label: "Logs", icon: icons.collections },
  { key: "report", label: "Report", icon: icons.report },
];