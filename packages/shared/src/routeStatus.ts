/**
 * Status values that may be assigned to a Route.
 *
 * These values are shared between
 * frontend, backend and websocket events.
 */

export type RouteStatus =
  | "In Progress"
  | "Completed"
  | "Not Started";

export interface UpdateRouteStatusRequest {
  status: RouteStatus;
}