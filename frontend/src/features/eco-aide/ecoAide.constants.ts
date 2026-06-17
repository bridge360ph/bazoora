import type { EcoAideRouteStop, EcoAideTask } from "./ecoAide.types";

export const MOCK_ECO_AIDE_TASKS: EcoAideTask[] = [
  {
    id: "task-001",
    title: "On-demand hauling request",
    location: "Barangay Poblacion",
    wasteType: "Non-recyclable waste",
    feeStatus: "Paid",
    status: "Pending",
  },
  {
    id: "task-002",
    title: "Recyclable material pickup",
    location: "San Juan, Batangas",
    wasteType: "Recyclable materials",
    feeStatus: "Free",
    status: "In Progress",
  },
];

export const MOCK_ROUTE_STOPS: EcoAideRouteStop[] = [
  {
    id: "stop-001",
    address: "Poblacion Street 1",
    status: "Pending",
  },
  {
    id: "stop-002",
    address: "Poblacion Street 2",
    status: "In Progress",
  },
  {
    id: "stop-003",
    address: "Poblacion Street 3",
    status: "Completed",
  },
];