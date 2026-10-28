/**
 * Shared request DTOs used by both the frontend and backend.
 *
 * These are the JSON bodies sent to the Route Assignment API.
 *
 * Backend:
 *  - Used as request body types.
 *
 * Frontend:
 *  - Used when constructing fetch requests.
 */

export interface AssignEcoAideRequest {
  /** Null clears the current assignment. */
  ecoAideId: string | null;
}

export interface AssignTruckRequest {
  /** Null takes the truck off the route. */
  truckId: string | null;
}

/** A truck option for the route Assign Truck dropdown. */
export interface RouteTruckOption {
  id: string;
  truckNumber: string | null;
  plateNumber: string;
  status: string;
  /** The route this truck is on, or null when it is free. */
  assignedRouteId: string | null;
}
