import type { HaulingRequest } from "@bazoora/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

interface ApiErrorResponse {
  message?: string;
}

// PATCH /hauling-requests/:id/deny

export async function denyHaulingRequest({
  requestId,
  denialReason,
}: {
  requestId: string;
  denialReason: string;
}): Promise<HaulingRequest> {
  const res = await fetch(
    `${API_URL}/hauling-requests/${requestId}/deny`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        denialReason,
      }),
    },
  );

  if (!res.ok) {
    const error = (await res.json().catch(() => null)) as ApiErrorResponse | null;

    throw new Error(
      error?.message ?? `Request failed: ${res.status}`,
    );
  }

  return (await res.json()) as HaulingRequest;
}