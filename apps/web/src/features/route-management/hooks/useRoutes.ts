import { useCallback, useEffect, useState } from "react";
import type { Route } from "@bazoora/shared";
import { fetchRoutes } from "../routeService";

interface UseRoutesResult {
  data: Route[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useRoutes(): UseRoutesResult {
  const [data, setData] = useState<Route[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    fetchRoutes()
      .then((routes) => {
        if (!isCancelled) {
          setData(routes);
          setError(null);
        }
      })
      .catch((fetchError: Error) => {
        if (!isCancelled) {
          setError(fetchError);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [refetchToken]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setRefetchToken((current) => current + 1);
  }, []);

  return { data, isLoading, isError: error !== null, error, refetch };
}