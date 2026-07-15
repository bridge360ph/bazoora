import type { HaulingRequest } from "@bazoora/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function fetchHaulingRequests(): Promise<HaulingRequest[]> {
  const res = await fetch(`${API_URL}/hauling-requests`);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return (await res.json()) as HaulingRequest[];
}