export type RouteStatus =
  | "In Progress"
  | "Completed"
  | "Not Started";

export interface UpdateRouteStatusRequest {
  status: RouteStatus;
}