import type { HaulingRequest } from "@bazoora/shared";

import { apiClient } from "@/lib/api-client";
import { toHaulingRequestError } from "./haulingRequestError";

interface ApproveHaulingRequestVariables {
  requestId: string;
  /** Optional: the request can be assigned to a route later. */
  routeId: string | null;
}

// PATCH /hauling-requests/:id/approve
export async function approveHaulingRequest({
  requestId,
  routeId,
}: ApproveHaulingRequestVariables): Promise<HaulingRequest> {
  try {
    const { data } = await apiClient.patch<HaulingRequest>(
      `/hauling-requests/${requestId}/approve`,
      { routeId },
    );
    return data;
  } catch (error) {
    throw toHaulingRequestError(
      error,
      "Failed to approve request",
    );
  }
}
