export type EcoAideTaskStatus = "Pending" | "In Progress" | "Completed";

export type EcoAideTask = {
  id: string;
  title: string;
  location: string;
  wasteType: string;
  feeStatus: "Paid" | "Free";
  status: EcoAideTaskStatus;
};

export type EcoAideRouteStop = {
  id: string;
  address: string;
  status: EcoAideTaskStatus;
};