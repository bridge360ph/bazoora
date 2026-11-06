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

/** A driver account, from GET /admin/fleet/drivers. */
export interface FleetDriver {
  id: string;
  userNumber: string | null;
  name: string;
  email: string;
  /** ISO date the account was created. */
  addedAt: string;
  truck: {
    id: string;
    truckNumber: string | null;
    plateNumber: string;
    status: string;
    route: { routeDisplayNumber: string; name: string } | null;
  } | null;
}

export interface DriverFormValue {
  name: string;
  email: string;
  password: string;
}
