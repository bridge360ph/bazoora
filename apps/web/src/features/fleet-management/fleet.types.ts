import type { WasteType } from "@bazoora/shared";

export type TruckStatus = "Active" | "Idle" | "Under Maintenance";

export type TruckStatusFilter = "All" | TruckStatus;

export interface FleetAssignmentOption {
  id: string;
  label: string;
  /** Set on route options: the waste type the route collects. */
  wasteType?: string;
  /** Set on route options: "Free" (weekly) or "Paid". */
  routeType?: string;
  /** Set on route options: the branch the route is run from. */
  startBranchId?: string | null;
}

export interface Truck {
  databaseId: string;
  id: string;
  plateNumber: string;
  model: string;
  capacity: string;
  status: TruckStatus;
  /** Null on trucks registered before branches existed. */
  branchId: string | null;
  /** The one waste type the truck carries. Null on older trucks. */
  wasteType: WasteType | null;
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
  /** Empty until a branch is picked. */
  branchId: string;
  /** Empty until a waste type is picked. */
  wasteType: WasteType | "";
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
    /** A driver works from their truck's branch. */
    branchId: string | null;
    route: { routeDisplayNumber: string; name: string } | null;
  } | null;
}

export interface DriverFormValue {
  name: string;
  email: string;
  password: string;
}
