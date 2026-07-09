import { useQuery } from "@tanstack/react-query";
import type { HealthResponse } from "@bazoora/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_URL}/`);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return (await res.json()) as HealthResponse;
}

// Placeholder admin landing screen. Keeps the backend-connectivity indicator
// that used to live in App.tsx. Replace with the real dashboard home when ready.
export function AdminHome() {
  const { data, isError } = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
  });

  const status = data ? data.status : isError ? "error" : "loading…";

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-sm text-gray-500">
        Backend status: <span className="font-medium">{status}</span>
      </p>
    </div>
  );
}