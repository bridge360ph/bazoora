import { apiClient } from "@/lib/api-client";
import type {
  FleetAssignmentOption,
  Truck,
  TruckFormValue,
} from "./fleet.types";

type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
};

async function apiRequest<T>(
  method: "GET" | "POST" | "PATCH",
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await apiClient.request<ApiResponse<T>>({
    method,
    url: path,
    data: body,
  });

  if (!response.data.success) {
    throw new Error(response.data.error ?? "Fleet request failed.");
  }

  return response.data.data;
}

export function fetchTrucks() {
  return apiRequest<Truck[]>("GET", "/admin/fleet");
}

export function createTruck(formValue: TruckFormValue) {
  return apiRequest<Truck>("POST", "/admin/fleet", formValue);
}

export function updateTruck(
  truckDatabaseId: string,
  formValue: TruckFormValue,
) {
  return apiRequest<Truck>("PATCH", `/admin/fleet/${truckDatabaseId}`, formValue);
}

export function updateTruckAssignment(
  truckDatabaseId: string,
  routeId: string,
  ecoAideId: string,
) {
  return apiRequest<Truck>(
    "PATCH",
    `/admin/fleet/${truckDatabaseId}/assignment`,
    {
      routeId,
      ecoAideId,
    },
  );
}

export function fetchFleetAssignmentOptions() {
  return apiRequest<{
    routes: FleetAssignmentOption[];
    ecoAides: FleetAssignmentOption[];
    drivers: FleetAssignmentOption[];
  }>("GET", "/admin/fleet/assignment-options");
}

