import type {
  Route,
} from "@bazoora/shared";
import type {
  RouteFormValue,
} from "./route.types.ts";

const API_URL = "http://localhost:3000/routes";

export async function fetchRoutes(): Promise<Route[]> {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch routes");
  }

  return response.json();
}


export async function createRouteRequest(
  formValue: RouteFormValue,
): Promise<Route> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formValue),
  });

  if (!response.ok) {
    throw new Error("Failed to create route");
  }

  return response.json();
}


export async function updateRouteRequest(
  routeId: string,
  formValue: RouteFormValue,
): Promise<Route> {
  const response = await fetch(`${API_URL}/${routeId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formValue),
  });

  if (!response.ok) {
    throw new Error("Failed to update route");
  }

  return response.json();
}
