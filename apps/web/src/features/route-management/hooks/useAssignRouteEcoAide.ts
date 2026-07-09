import { useState } from "react";
import type { Route } from "../../../types/route.types";
import { assignRouteEcoAideRequest } from "../routeService";

interface UseAssignRouteEcoAideVariables {
  routeId: string;
  ecoAide: string;
}

interface UseAssignRouteEcoAideOptions {
  onSuccess?: (route: Route) => void;
}

interface UseAssignRouteEcoAideResult {
  mutate: (
    variables: UseAssignRouteEcoAideVariables,
    options?: UseAssignRouteEcoAideOptions,
  ) => void;
  isPending: boolean;
  error: Error | null;
}

export function useAssignRouteEcoAide(): UseAssignRouteEcoAideResult {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  function mutate(
    { routeId, ecoAide }: UseAssignRouteEcoAideVariables,
    options?: UseAssignRouteEcoAideOptions,
  ) {
    setIsPending(true);
    setError(null);

    assignRouteEcoAideRequest(routeId, ecoAide)
      .then((route) => {
        options?.onSuccess?.(route);
      })
      .catch((mutationError: Error) => {
        setError(mutationError);
      })
      .finally(() => {
        setIsPending(false);
      });
  }

  return { mutate, isPending, error };
}
