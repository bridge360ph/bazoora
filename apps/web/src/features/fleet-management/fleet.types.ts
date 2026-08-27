export type TruckStatus = "Active" | "Idle" | "Under Maintenance";

export type TruckStatusFilter = "All" | TruckStatus;

export interface FleetAssignmentOption {
  id: string;
  label: string;
}

export interface Truck {
  databaseId: string;
  id: string;
  plateNumber: string;
  model: string;
  capacity: string;
  status: TruckStatus;
  assignedDriver: string;
  assignedDriverId?: string;
  registeredDate: string;
  assignedRoute?: string;
  assignedRouteId?: string;
  assignedEcoAide?: string;
  assignedEcoAideId?: string;
}

export interface TruckFormValue {
  plateNumber: string;
  model: string;
  capacity: string;
  status: TruckStatus;
  assignedDriver: string;
  assignedDriverId?: string;
}
