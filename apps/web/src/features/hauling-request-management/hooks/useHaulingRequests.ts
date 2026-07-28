import { useQuery } from "@tanstack/react-query";
import { fetchHaulingRequests } from "../fetchHaulingRequests";

export function useHaulingRequests() {
  return useQuery({
    queryKey: ["hauling-requests"],
    queryFn: fetchHaulingRequests,
  });
}