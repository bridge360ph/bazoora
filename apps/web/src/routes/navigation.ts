export interface NavItem {
  to: string;
  label: string;
  /** true for the index route so it isn't marked active on every child path */
  end?: boolean;
}

export const driverNavItems: NavItem[] = [
  { to: "/driver/route", label: "Collection Route" },
];
