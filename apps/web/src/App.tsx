import { useQuery } from "@tanstack/react-query";
import type { HealthResponse } from "@bazoora/shared";
import { useEffect } from "react";
import { EcoAideDashboard } from "./features/eco-aide/components/EcoAideDashboard";
import { socket } from "./lib/socket";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_URL}/`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as HealthResponse;
}

export default function App() {
  useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
  });

  useEffect(() => {
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  return <EcoAideDashboard />;
}
