import axios from "axios";

import { apiClient } from "@/lib/api-client";

export interface SettingsUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export interface SettingsProfile {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  streetAddress: string | null;
  region: string | null;
  barangay: string | null;
  cityMunicipality: string | null;
  province: string | null;
  postalCode: string | null;
  emailNotifications: boolean;
  pushNotifications: boolean;
  dailySummary: boolean;
  darkMode: boolean;
  autoAssignRoutes: boolean;
  realTimeTracking: boolean;
  automaticReports: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsData {
  user: SettingsUser;
  profile: SettingsProfile;
}

export interface UpdateProfileInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  streetAddress: string;
  region: string;
  barangay: string;
  cityMunicipality: string;
  province: string;
  postalCode: string;
}

export interface UpdatePreferencesInput {
  emailNotifications: boolean;
  pushNotifications: boolean;
  dailySummary: boolean;
  darkMode: boolean;
  autoAssignRoutes: boolean;
  realTimeTracking: boolean;
  automaticReports: boolean;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return fallbackMessage;
  }

  return (
    error.response?.data?.error ??
    error.response?.data?.message ??
    fallbackMessage
  );
}

export async function getMySettings(): Promise<SettingsData> {
  const response =
    await apiClient.get<ApiResponse<SettingsData>>("/settings/me");

  return response.data.data;
}

export async function updateMyProfile(
  input: UpdateProfileInput,
): Promise<SettingsData> {
  const response = await apiClient.patch<ApiResponse<SettingsData>>(
    "/settings/profile",
    input,
  );

  return response.data.data;
}

export async function updateMyPreferences(
  input: UpdatePreferencesInput,
): Promise<SettingsProfile> {
  const response = await apiClient.patch<
    ApiResponse<{ profile: SettingsProfile }>
  >("/settings/preferences", input);

  return response.data.data.profile;
}

export async function changeMyPassword(
  input: ChangePasswordInput,
): Promise<void> {
  await apiClient.post("/auth/change-password", input);
}

