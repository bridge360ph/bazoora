import axios from "axios";
import { apiClient } from "@/lib/api-client";
import type {
  DriverFormValue,
  FleetAssignmentOption,
  Truck,
  TruckFormValue,
} from "./fleet.types";

type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
};

type ApiErrorBody = {
  error?: string;
  passwordErrors?: string[];
};

/**
 * Axios rejects on 4xx/5xx with a generic "Request failed with status code"
 * message. The API puts the reason in the body, so surface that instead.
 */
function toFleetError(error: unknown): Error {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const body = error.response?.data;

    if (body?.passwordErrors && body.passwordErrors.length > 0) {
      return new Error(body.passwordErrors.join(" "));
    }

    if (body?.error) {
      return new Error(body.error);
    }
  }

  return error instanceof Error ? error : new Error("Fleet request failed.");
}

async function apiRequest<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await apiClient
    .request<ApiResponse<T>>({
      method,
      url: path,
      data: body,
    })
    .catch((error: unknown) => {
      throw toFleetError(error);
    });

  if (!response.data.success) {
    throw new Error(response.data.error ?? "Fleet request failed.");
  }

  return response.data.data;
}

export function fetchTrucks() {
  return apiRequest<Truck[]>("GET", "/admin/fleet");
}

/**
 * The form carries `assignedDriver` as a display name alongside the id, which
 * the API does not accept, so the payload is built field by field rather than
 * posting the whole form value.
 */
function toTruckPayload(formValue: TruckFormValue) {
  return {
    plateNumber: formValue.plateNumber,
    model: formValue.model,
    capacity: formValue.capacity,
    status: formValue.status,
    assignedDriverId: formValue.assignedDriverId ?? null,
  };
}

export function createTruck(formValue: TruckFormValue) {
  return apiRequest<Truck>("POST", "/admin/fleet", toTruckPayload(formValue));
}

export function updateTruck(
  truckDatabaseId: string,
  formValue: TruckFormValue,
) {
  return apiRequest<Truck>(
    "PATCH",
    `/admin/fleet/${truckDatabaseId}`,
    toTruckPayload(formValue),
  );
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

export function deleteTruck(truckDatabaseId: string) {
  return apiRequest<{ databaseId: string }>(
    "DELETE",
    `/admin/fleet/${truckDatabaseId}`,
  );
}

/**
 * Creates a driver account through the staff registration endpoint.
 */
export function createDriver(formValue: DriverFormValue) {
  return apiRequest<{
    user: { id: string; email: string; name: string | null; role: string };
  }>("POST", "/auth/register-staff", {
    name: formValue.name.trim(),
    email: formValue.email.trim(),
    password: formValue.password,
    role: "DRIVER",
  });
}
