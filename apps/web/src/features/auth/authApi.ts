import axios from "axios";

import { apiClient } from "@/lib/api-client";
import type { AuthUser } from "@/stores/auth-store";
import { mapApiUser, type ApiUser } from "./roles";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface LoginData {
  accessToken: string;
  user: ApiUser;
}

interface MeData {
  user: ApiUser;
}

export interface LoginResult {
  user: AuthUser;
  accessToken: string;
}

const DEFAULT_LOGIN_ERROR = "Unable to sign in. Please try again.";
const DEFAULT_ME_ERROR = "Unable to load your session.";

/**
 * Read the API's `error` field from a failed request, falling back to a
 * human-friendly default when the shape is not what we expect.
 */
function extractApiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const apiError = (error.response?.data as { error?: unknown } | undefined)?.error;
    if (typeof apiError === "string" && apiError.trim() !== "") {
      return apiError;
    }
  }
  return fallback;
}

/**
 * POST /auth/login. Sets the httpOnly refresh cookie server-side and returns
 * the access token plus the mapped user. Throws an Error carrying the API's
 * message on failure.
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    const { data } = await apiClient.post<ApiEnvelope<LoginData>>("/auth/login", {
      email,
      password,
    });
    return {
      user: mapApiUser(data.data.user),
      accessToken: data.data.accessToken,
    };
  } catch (error) {
    throw new Error(extractApiError(error, DEFAULT_LOGIN_ERROR));
  }
}

/**
 * POST /auth/logout. Revokes the session and clears the refresh cookie. Never
 * throws - logout should always let the client tear down local state.
 */
export async function logout(): Promise<void> {
  try {
    await apiClient.post("/auth/logout", {});
  } catch {
    // Ignore network/logout errors; the caller clears local state regardless.
  }
}

/**
 * GET /auth/me. Validates and hydrates the current session using the access
 * token injected by the api-client interceptor.
 */
export async function fetchMe(): Promise<AuthUser> {
  try {
    const { data } = await apiClient.get<ApiEnvelope<MeData>>("/auth/me");
    return mapApiUser(data.data.user);
  } catch (error) {
    throw new Error(extractApiError(error, DEFAULT_ME_ERROR));
  }
}
