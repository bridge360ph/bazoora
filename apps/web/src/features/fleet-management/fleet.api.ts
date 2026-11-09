import axios from "axios";
import { apiClient } from "@/lib/api-client";
import type {
  DriverFormValue,
  FleetAssignmentOption,
  FleetDriver,
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
  /** Set by Fastify when the body fails the schema; `error` is then only "Bad Request". */
  message?: string;
  passwordErrors?: string[];
};

/** Fastify's schema messages, such as "body/branchId must be equal to one of the allowed values". */
function describeValidationError(message: string): string {
  // The page sent a field the server does not accept, usually because the
  // page is older than the server.
  if (/wasteTypes|additional properties/.test(message)) {
    return "Some of the truck details were not accepted. Refresh the page and try again.";
  }
  if (/branchId/.test(message)) return "Select the truck's branch.";
  if (/wasteType/.test(message)) return "Select the waste type the truck carries.";
  return message;
}

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

    if (error.response?.status === 400 && body?.message) {
      return new Error(describeValidationError(body.message));
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
    branchId: formValue.branchId,
    wasteType: formValue.wasteType,
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
  /** Optional until Eco-Aide assignment is ready. */
  ecoAideId: string,
) {
  return apiRequest<Truck>(
    "PATCH",
    `/admin/fleet/${truckDatabaseId}/assignment`,
    {
      routeId,
      ...(ecoAideId && { ecoAideId }),
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

export const FLEET_DRIVERS_QUERY_KEY = ["fleet-drivers"] as const;

export function fetchDrivers() {
  return apiRequest<FleetDriver[]>("GET", "/admin/fleet/drivers");
}

export function deleteDriver(driverId: string) {
  return apiRequest<{ id: string }>("DELETE", `/admin/fleet/drivers/${driverId}`);
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
