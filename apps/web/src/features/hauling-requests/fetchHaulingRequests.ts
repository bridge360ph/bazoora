import type { HaulingRequest } from "@bazoora/shared";

import { apiClient } from "@/lib/api-client";
import { toHaulingRequestError } from "./haulingRequestError";

export async function fetchHaulingRequests(): Promise<HaulingRequest[]> {
  try {
    const { data } = await apiClient.get<HaulingRequest[]>(
      "/hauling-requests",
    );
    return data;
  } catch (error) {
    throw toHaulingRequestError(
      error,
      "Failed to load hauling requests",
    );
  }
}
