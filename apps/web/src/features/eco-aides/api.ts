import { apiClient } from "../../lib/api-client";

export type ApiEcoAideStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "DEACTIVATED";

export type ApiEcoAideAvailability =
  | "AVAILABLE"
  | "ON_ROUTE"
  | "OFF_DUTY";

export interface ApiEcoAide {
  ecoAideId: string;
  name: string;
  email: string;
  phone: string | null;
  birthdate: string | null;
  address: string | null;
  status: ApiEcoAideStatus;
  availability: ApiEcoAideAvailability;
  assignedRoute: {
    routeNumber: number;
    name: string;
    assignedTruck: {
      truckNumber: string;
    } | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface EcoAideResponse {
  success: true;
  data: ApiEcoAide;
}

interface EcoAideListResponse {
  success: true;
  data: ApiEcoAide[];
}

export interface CreateEcoAideInput {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  birthdate?: string;
  address?: string;
  status?: ApiEcoAideStatus;
  availability?: ApiEcoAideAvailability;
}

export interface UpdateEcoAideInput {
  name?: string;
  phone?: string | null;
  birthdate?: string;
  address?: string;
  status?: ApiEcoAideStatus;
  availability?: ApiEcoAideAvailability;
}

export async function getEcoAides(): Promise<ApiEcoAide[]> {
  const { data } =
    await apiClient.get<EcoAideListResponse>("/eco-aides");

  return data.data;
}

export async function createEcoAide(
  input: CreateEcoAideInput,
): Promise<ApiEcoAide> {
  const { data } =
    await apiClient.post<EcoAideResponse>("/eco-aides", input);

  return data.data;
}

export async function updateEcoAide(
  ecoAideId: string,
  input: UpdateEcoAideInput,
): Promise<ApiEcoAide> {
  const { data } =
    await apiClient.patch<EcoAideResponse>(
      `/eco-aides/${ecoAideId}`,
      input,
    );

  return data.data;
}

export async function suspendEcoAide(
  ecoAideId: string,
): Promise<ApiEcoAide> {
  const { data } =
    await apiClient.patch<EcoAideResponse>(
      `/eco-aides/${ecoAideId}/suspend`,
    );

  return data.data;
}

export async function deactivateEcoAide(
  ecoAideId: string,
): Promise<ApiEcoAide> {
  const { data } =
    await apiClient.patch<EcoAideResponse>(
      `/eco-aides/${ecoAideId}/deactivate`,
    );

  return data.data;
}

export async function archiveEcoAide(
  ecoAideId: string,
): Promise<void> {
  await apiClient.patch(`/eco-aides/${ecoAideId}/archive`);
}
