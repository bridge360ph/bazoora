import { useState } from "react";
import { deleteRouteRequest } from "../routeService";

interface UseDeleteRouteOptions {
  onSuccess?: () => void;
}

interface UseDeleteRouteResult {
  mutate: (routeId: string, options?: UseDeleteRouteOptions) => void;
  isPending: boolean;
  error: Error | null;
  reset: () => void;
}

export function useDeleteRoute(): UseDeleteRouteResult {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  function mutate(routeId: string, options?: UseDeleteRouteOptions) {
    setIsPending(true);
    setError(null);

    deleteRouteRequest(routeId)
      .then(() => {
        options?.onSuccess?.();
      })
      .catch((mutationError: Error) => {
        setError(mutationError);
      })
      .finally(() => {
        setIsPending(false);
      });
  }

  function reset() {
    setError(null);
  }

  return { mutate, isPending, error, reset };
}
