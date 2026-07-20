export type EcoAideAvailability =
  | "Available"
  | "On Route"
  | "Off Duty";

export type RequestStatus =
  | "Pending"
  | "Assigned"
  | "Completed";

export interface EcoAide {
  id: string;
  name: string;
  availability: EcoAideAvailability;
}

export interface RequestItem {
  id: string;
  location: string;
  wasteType: string;
  status: RequestStatus;
  ecoAide: string;
}

export interface DashboardStat {
  label: string;
  value: string | number;
}

export const ecoAides: EcoAide[] = [
  {
    id: "EA-001",
    name: "John Mendoza",
    availability: "Available",
  },
  {
    id: "EA-002",
    name: "Emil Perez",
    availability: "On Route",
  },
  {
    id: "EA-003",
    name: "Ferdinand Ramos",
    availability: "Available",
  },
  {
    id: "EA-004",
    name: "Mark Santiago",
    availability: "Off Duty",
  },
  {
    id: "EA-005",
    name: "Romy Rosario",
    availability: "On Route",
  },
];

export const requestQueue: RequestItem[] = [
  {
    id: "Req-001",
    location: "San Juan",
    wasteType: "Recyclable",
    status: "Pending",
    ecoAide: "-",
  },
  {
    id: "Req-002",
    location: "San Pedro",
    wasteType: "Regular/Non-Recyclable",
    status: "Pending",
    ecoAide: "John Mendoza",
  },
  {
    id: "Req-003",
    location: "San Mateo",
    wasteType: "Regular/Non-Recyclable",
    status: "Pending",
    ecoAide: "Emil Flores",
  },
  {
    id: "Req-004",
    location: "Poblacion",
    wasteType: "Recyclable",
    status: "Pending",
    ecoAide: "-",
  },
];

export const summaryStats: DashboardStat[] = [
  {
    label: "Total Eco-Aides",
    value: "200",
  },
  {
    label: "Completed Pickups",
    value: "32",
  },
  {
    label: "Pending Requests",
    value: "12",
  },
  {
    label: "Revenue (Paid Services)",
    value: "200",
  },
];

export const quickStats: DashboardStat[] = [
  {
    label: "Active Pickups",
    value: "8",
  },
  {
    label: "Unassigned Requests",
    value: "5",
  },
];

export const routeStats: DashboardStat[] = [
  {
    label: "In Progress",
    value: 3,
  },
  {
    label: "Not Started",
    value: 4,
  },
  {
    label: "Completed Today",
    value: 10,
  },
  {
    label: "Total Routes",
    value: 17,
  },
];
