import axios from "axios";
import type {
  Route,
} from "@bazoora/shared";
import { apiClient } from "@/lib/api-client";
import type {
  RouteFormValue,
} from "./route.types.ts";

/**
 * Route-management API calls.
 *
 * These go through `apiClient` so every request carries the access token and
 * can silently refresh once on 401. The route endpoints are guarded by
 * `authGuard` + `requireRole`, so a plain `fetch` would always be rejected.
 */

/**
 * Rethrows an API failure as an Error carrying the server's message when it
 * sent one, so the hooks can surface it instead of a generic axios string.
 */
function toApiError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    const message = (
      error.response?.data as { message?: string } | undefined
    )?.message;

    if (message !== undefined && message !== "") {
      return new Error(message);
    }
  }

  return new Error(fallback);
}

export async function fetchRoutes(): Promise<Route[]> {
  try {
    const response = await apiClient.get<Route[]>("/routes");

    return response.data;
  } catch (error) {
    throw toApiError(error, "Failed to fetch routes");
  }
}

export async function createRouteRequest(
  formValue: RouteFormValue,
): Promise<Route> {
  try {
    const response = await apiClient.post<Route>(
      "/routes",
      formValue,
    );

    return response.data;
  } catch (error) {
    throw toApiError(error, "Failed to create route");
  }
}

export async function updateRouteRequest(
  routeId: string,
  formValue: RouteFormValue,
): Promise<Route> {
  try {
    const response = await apiClient.patch<Route>(
      `/routes/${routeId}`,
      formValue,
    );

    return response.data;
  } catch (error) {
    throw toApiError(error, "Failed to update route");
  }
}
