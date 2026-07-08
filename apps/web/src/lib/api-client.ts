import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

import { env } from "@/lib/env";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Central HTTP client.
 *
 * - Base URL from NEXT_PUBLIC_API_URL (e.g. http://localhost:4000/api/v1).
 * - `withCredentials: true` so the refresh-token httpOnly cookie travels.
 * - Request interceptor injects the current access token from the auth store.
 * - Response interceptor attempts a silent refresh on 401 once, then retries.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout: 15_000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

interface RetriableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshInFlight: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  try {
    const { data } = await axios.post<{ data: { accessToken: string } }>(
      `${env.NEXT_PUBLIC_API_URL}/auth/refresh`,
      {},
      { withCredentials: true },
    );
    const newToken = data.data.accessToken;
    useAuthStore.getState().setAccessToken(newToken);
    return newToken;
  } catch {
    useAuthStore.getState().clear();
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.response || !error.config) {
      throw error;
    }

    const original = error.config as RetriableRequest;
    const isAuthRoute = original.url?.includes("/auth/") ?? false;

    if (error.response.status !== 401 || original._retry === true || isAuthRoute) {
      throw error;
    }

    original._retry = true;
    refreshInFlight ??= performRefresh();
    const newToken = await refreshInFlight;
    refreshInFlight = null;

    if (newToken === null) {
      throw error;
    }

    original.headers.set("Authorization", `Bearer ${newToken}`);
    return apiClient.request(original);
  },
);
