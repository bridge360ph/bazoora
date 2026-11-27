import { useQuery } from "@tanstack/react-query";
import { fetchHaulingRouteOptions } from "../haulingRouteApi";

export function useHaulingRouteOptions(requestId: string) {
  return useQuery({
    queryKey: ["hauling-requests", requestId, "route-options"],
    queryFn: () => fetchHaulingRouteOptions(requestId),
  });
}
