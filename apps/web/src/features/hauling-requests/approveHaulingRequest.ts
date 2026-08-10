import type { HaulingRequest } from "@bazoora/shared";

import { apiClient } from "@/lib/api-client";
import { toHaulingRequestError } from "./haulingRequestError";

// PATCH /hauling-requests/:id/approve
export async function approveHaulingRequest(
  requestId: string,
): Promise<HaulingRequest> {
  try {
    const { data } = await apiClient.patch<HaulingRequest>(
      `/hauling-requests/${requestId}/approve`,
    );
    return data;
  } catch (error) {
    throw toHaulingRequestError(
      error,
      "Failed to approve request",
    );
  }
}
