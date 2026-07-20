import type { EcoAide, EcoAideStatus } from "./ecoAides.types";

type BackendEcoAideStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
type BackendEcoAideAvailability = "AVAILABLE" | "ON_ROUTE" | "OFF_DUTY";

interface BackendEcoAide {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string | null;
  status: BackendEcoAideStatus;
  availability: BackendEcoAideAvailability;
  createdAt: string;
  updatedAt: string;
}

interface EcoAideListResponse {
  success: boolean;
  data: BackendEcoAide[];
  message?: string;
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

function mapBackendEcoAide(
  ecoAide: BackendEcoAide,
): EcoAide {
  return {
    id: ecoAide.id,
    name: ecoAide.name,
    addedDate: new Date(ecoAide.createdAt).toLocaleDateString("en-PH"),
    status: getFrontendStatus(ecoAide),
    contactNumber: ecoAide.phone ?? "",
    birthdate: "",
    address: "",
    assignedRoute: "",
    assignedTruck: "",
    totalRoutes: 0,
    completionRate: "0%",
    missedAssignment: 0,
    email: ecoAide.email,
  };
}

export async function fetchEcoAides(): Promise<EcoAide[]> {
  const response = await fetch(`${API_BASE_URL}/eco-aides`, {
    headers: {
      Accept: "application/json",
    },
  });

  const result = (await response.json()) as EcoAideListResponse;

  if (!response.ok || !result.success) {
    throw new Error(result.message ?? "Unable to load Eco-Aides.");
  }

  return result.data.map(mapBackendEcoAide);
}
