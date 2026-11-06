export type EcoAideStatus =
  | "Active"
  | "On Route"
  | "Off Duty"
  | "Suspended"
  | "Deactivated";

export type EcoAideStatusFilter = "All" | EcoAideStatus;

export interface EcoAide {
  id: string;
  name: string;
  addedDate: string;
  status: EcoAideStatus;
  contactNumber: string;
  birthdate: string;
  address: string;
  assignedRoute: string;
  assignedTruck: string;
  email: string;
}
