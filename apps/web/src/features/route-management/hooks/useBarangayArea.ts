import { useQuery } from "@tanstack/react-query";

import { findAreaBoundary } from "@/lib/area";

/**
 * The outline of a route's barangay, looked up by its "Barangay, City"
 * label. Null while loading, when no label is set, or when it is not found.
 */
export function useBarangayArea(barangayLabel: string) {
  const label = barangayLabel.trim();

  const query = useQuery({
    queryKey: ["barangay-area", label.toLowerCase()],
    queryFn: () => findAreaBoundary(label),
    enabled: label.length >= 3,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  return {
    area: query.data ?? null,
    isLoading: query.isFetching,
    notFound: query.isSuccess && query.data === null,
  };
}
