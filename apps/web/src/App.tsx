import { useQuery } from "@tanstack/react-query";
import type { HealthResponse } from "@bazoora/shared";
import { useEffect } from "react";
import { socket } from "./lib/socket";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_URL}/`);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return (await res.json()) as HealthResponse;
}

function App() {
  const { data, isError } = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
  });

  useEffect(() => {
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  const status = data ? data.status : isError ? "error" : "loading…";

  return <h1>Backend Status: {status}</h1>;
}

export default App;