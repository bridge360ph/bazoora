import axios, {
  type AxiosInstance,
} from "axios";

import { env } from "@/lib/env";

/**
 * Temporary admin development API client.
 *
 * Unlike api-client.ts:
 * - Does not send cookies (`withCredentials: false`)
 * - Does not attach Authorization headers
 * - Does not attempt token refresh
 *
 * Reason:
 * Admin authentication is not currently implemented, but some admin
 * features require API access during development.
 *
 * Once admin authentication is available, this file should be removed and
 * admin features should use the authenticated apiClient.ts instead.
 *
 * TODO: Remove this file after admin authentication is implemented.
 */
export const adminApiClient: AxiosInstance = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: false,
  timeout: 15_000,
});