export interface NavItem {
  to: string;
  label: string;
  /** true for the index route so it isn't marked active on every child path */
  end?: boolean;
}

export const ecoAideNavItems: NavItem[] = [
  { to: "/eco-aide/route", label: "Hauling Route" },
];
