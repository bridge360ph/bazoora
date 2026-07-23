/** Response shape returned by the backend health-check endpoint (`GET /`). */
export interface HealthResponse {
  status: string;
}

export * from "./haulingRequest.js";
export * from "./route.js";
export * from "./routeStatus.js";