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
  ecoAideId: string;
}