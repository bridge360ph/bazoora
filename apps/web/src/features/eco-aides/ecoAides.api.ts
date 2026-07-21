import type { EcoAide, EcoAideStatus } from "./ecoAides.types";

type BackendEcoAideStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "DEACTIVATED";

type BackendEcoAideAvailability =
  | "AVAILABLE"
  | "ON_ROUTE"
  | "OFF_DUTY";

interface BackendAssignedRoute {
  routeNumber: number;
  name: string;
}

interface BackendEcoAide {
  ecoAideId: string;
  name: string;
  email: string;
  phone: string | null;
  status: BackendEcoAideStatus;
  availability: BackendEcoAideAvailability;
  assignedRoute: BackendAssignedRoute | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<Data> {
  success: boolean;
  data: Data;
  message?: string;
}

interface UpdateEcoAideInput {
  contactNumber: string;
  status: EcoAideStatus;
}

interface BackendUpdateInput {
  phone: string | null;
  status: BackendEcoAideStatus;
  availability: BackendEcoAideAvailability;
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function getFrontendStatus(
  ecoAide: BackendEcoAide,
): EcoAideStatus {
  if (ecoAide.status === "SUSPENDED") {
    return "Suspended";
  }

  if (ecoAide.status === "DEACTIVATED") {
    return "Deactivated";
  }

  if (ecoAide.availability === "ON_ROUTE") {
    return "On Route";
  }

  if (ecoAide.availability === "OFF_DUTY") {
    return "Off Duty";
  }

  return "Active";
}

function getBackendUpdateInput(
  input: UpdateEcoAideInput,
): BackendUpdateInput {
  const phone = input.contactNumber.trim() || null;

  if (input.status === "Suspended") {
    return {
      phone,
      status: "SUSPENDED",
      availability: "OFF_DUTY",
    };
  }

  if (input.status === "Deactivated") {
    return {
      phone,
      status: "DEACTIVATED",
      availability: "OFF_DUTY",
    };
  }

  if (input.status === "On Route") {
    return {
      phone,
      status: "ACTIVE",
      availability: "ON_ROUTE",
    };
  }

  if (input.status === "Off Duty") {
    return {
      phone,
      status: "ACTIVE",
      availability: "OFF_DUTY",
    };
  }

  return {
    phone,
    status: "ACTIVE",
    availability: "AVAILABLE",
  };
}

function mapAssignedRoute(
  assignedRoute: BackendAssignedRoute | null,
): string {
  if (!assignedRoute) {
    return "";
  }

  const routeId = `RT-${String(
    assignedRoute.routeNumber,
  ).padStart(3, "0")}`;

  return `${routeId} - ${assignedRoute.name}`;
}

function mapBackendEcoAide(
  ecoAide: BackendEcoAide,
): EcoAide {
  return {
    // This is the public ID, such as EA-001.
    // The private database CUID is never sent to the frontend.
    id: ecoAide.ecoAideId,
    name: ecoAide.name,
    addedDate: new Date(
      ecoAide.createdAt,
    ).toLocaleDateString("en-PH"),
    status: getFrontendStatus(ecoAide),
    contactNumber: ecoAide.phone ?? "",
    birthdate: "",
    address: "",
    assignedRoute: mapAssignedRoute(
      ecoAide.assignedRoute,
    ),
    assignedTruck: "",
    totalRoutes: 0,
    completionRate: "0%",
    missedAssignment: 0,
    email: ecoAide.email,
  };
}

async function apiRequest<Data>(
  path: string,
  options?: RequestInit,
): Promise<Data> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(
        options?.body
          ? { "Content-Type": "application/json" }
          : {}
      ),
      ...options?.headers,
    },
  });

  let result: ApiResponse<Data>;

  try {
    result = (await response.json()) as ApiResponse<Data>;
  } catch {
    throw new Error(
      "The Eco-Aide API returned an invalid response.",
    );
  }

  if (!response.ok || !result.success) {
    throw new Error(
      result.message ?? "Unable to complete the request.",
    );
  }

  return result.data;
}

export async function fetchEcoAides(): Promise<EcoAide[]> {
  const ecoAides =
    await apiRequest<BackendEcoAide[]>("/eco-aides");

  return ecoAides.map(mapBackendEcoAide);
}

export async function updateEcoAide(
  ecoAideId: string,
  input: UpdateEcoAideInput,
): Promise<EcoAide> {
  const updatedEcoAide =
    await apiRequest<BackendEcoAide>(
      `/eco-aides/${encodeURIComponent(ecoAideId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(
          getBackendUpdateInput(input),
        ),
      },
    );

  return mapBackendEcoAide(updatedEcoAide);
}

export async function suspendEcoAide(
  ecoAideId: string,
): Promise<EcoAide> {
  const updatedEcoAide =
    await apiRequest<BackendEcoAide>(
      `/eco-aides/${encodeURIComponent(
        ecoAideId,
      )}/suspend`,
      {
        method: "PATCH",
      },
    );

  return mapBackendEcoAide(updatedEcoAide);
}

export async function deactivateEcoAide(
  ecoAideId: string,
): Promise<EcoAide> {
  const updatedEcoAide =
    await apiRequest<BackendEcoAide>(
      `/eco-aides/${encodeURIComponent(
        ecoAideId,
      )}/deactivate`,
      {
        method: "PATCH",
      },
    );

  return mapBackendEcoAide(updatedEcoAide);
}

export async function archiveEcoAide(
  ecoAideId: string,
): Promise<void> {
  await apiRequest<{ ecoAideId: string }>(
    `/eco-aides/${encodeURIComponent(
      ecoAideId,
    )}/archive`,
    {
      method: "PATCH",
    },
  );
}

