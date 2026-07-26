import { useState } from "react";
import type { Route } from "@bazoora/shared";
import { assignRouteTruckRequest } from "../routeAssignmentApi";

interface UseAssignRouteTruckVariables {
  routeId: string;
  truckId: string;
}

interface UseAssignRouteTruckOptions {
  onSuccess?: (route: Route) => void;
}

interface UseAssignRouteTruckResult {
  mutate: (
    variables: UseAssignRouteTruckVariables,
    options?: UseAssignRouteTruckOptions,
  ) => void;
  isPending: boolean;
  error: Error | null;
}

export function useAssignRouteTruck(): UseAssignRouteTruckResult {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  function mutate(
    { routeId, truckId }: UseAssignRouteTruckVariables,
    options?: UseAssignRouteTruckOptions,
  ) {
    setIsPending(true);
    setError(null);

    assignRouteTruckRequest(routeId, truckId)
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
