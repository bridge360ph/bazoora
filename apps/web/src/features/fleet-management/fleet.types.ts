export type TruckStatus = "Active" | "Idle" | "Under Maintenance";

export type TruckStatusFilter = "All" | TruckStatus;

export interface Truck {
  id: string;
  plateNumber: string;
  model: string;
  capacity: string;
  status: TruckStatus;
  assignedDriver: string;
  registeredDate: string;
  assignedRoute?: string;
  assignedEcoAide?: string;
}

export interface TruckFormValue {
  plateNumber: string;
  model: string;
  capacity: string;
  status: TruckStatus;
  assignedDriver: string;
}
