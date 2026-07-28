import type { HaulingRequest } from "@bazoora/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// PATCH /hauling-requests/:id/approve
export async function approveHaulingRequest(
  requestId: string,
): Promise<HaulingRequest> {
  const res = await fetch(
    `${API_URL}/hauling-requests/${requestId}/approve`,
    { method: "PATCH" },
  );
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return (await res.json()) as HaulingRequest;
}