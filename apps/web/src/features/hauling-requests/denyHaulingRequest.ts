import type { HaulingRequest } from "@bazoora/shared";

import { apiClient } from "@/lib/api-client";
import { toHaulingRequestError } from "./haulingRequestError";

export interface DenyHaulingRequestInput {
  requestId: string;
  denialReason: string;
}

// PATCH /hauling-requests/:id/deny
export async function denyHaulingRequest({
  requestId,
  denialReason,
}: DenyHaulingRequestInput): Promise<HaulingRequest> {
  try {
    const { data } = await apiClient.patch<HaulingRequest>(
      `/hauling-requests/${requestId}/deny`,
      { denialReason },
    );
    return data;
  } catch (error) {
    throw toHaulingRequestError(
      error,
      "Failed to deny request",
    );
  }
}
