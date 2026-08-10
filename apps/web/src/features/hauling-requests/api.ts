import { apiClient } from "@/lib/api-client";
import type { CreateHaulingRequestInput, PublicHaulingRequest } from "./schemas";

export async function listHaulingRequests(): Promise<PublicHaulingRequest[]> {
  const { data } = await apiClient.get<{ success: boolean; data: PublicHaulingRequest[] }>(
    "/hauling-requests",
  );
  return data.data;
}

export async function createHaulingRequest(
  input: CreateHaulingRequestInput,
): Promise<PublicHaulingRequest> {
  const { data } = await apiClient.post<{ success: boolean; data: PublicHaulingRequest }>(
    "/hauling-requests",
    input,
  );
  return data.data;
}

// fix: update input type to accept all updatable fields, not just status
export async function updateHaulingRequest(
  id: string,
  input: {
    status?: string;
    proofPhotoUrl?: string | null;
    declineReason?: string | null;
    paymentStatus?: "unpaid" | "paid";
  },
): Promise<PublicHaulingRequest> {
  const { data } = await apiClient.patch<{ success: boolean; data: PublicHaulingRequest }>(
    `/hauling-requests/${id}/status`,
    input,
  );
  return data.data;
}

export async function uploadImage(base64: string, mimeType: string): Promise<string> {
  const { data } = await apiClient.post<{ success: boolean; data: { url: string } }>(
    "/uploads/image",
    { base64, mimeType },
  );
  return data.data.url;
}
