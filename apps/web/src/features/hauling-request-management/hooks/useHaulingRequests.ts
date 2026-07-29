import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchHaulingRequests } from "../fetchHaulingRequests";
import type { HaulingRequest } from "@bazoora/shared";

export function useHaulingRequests(
  options?: Omit<
    UseQueryOptions<HaulingRequest[]>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: ["hauling-requests"],
    queryFn: fetchHaulingRequests,
    ...options,
  });
}