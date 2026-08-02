import { useState } from "react";
import type {
  Route,
} from "@bazoora/shared";
import type {
  RouteFormValue,
} from "../route.types.ts";
import { updateRouteRequest } from "../routeManagementApi";

interface UseUpdateRouteVariables {
  routeId: string;
  formValue: RouteFormValue;
}

interface UseUpdateRouteOptions {
  onSuccess?: (route: Route) => void;
}

interface UseUpdateRouteResult {
  mutate: (
    variables: UseUpdateRouteVariables,
    options?: UseUpdateRouteOptions,
  ) => void;
  isPending: boolean;
  error: Error | null;
}

export function useUpdateRoute(): UseUpdateRouteResult {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  function mutate(
    { routeId, formValue }: UseUpdateRouteVariables,
    options?: UseUpdateRouteOptions,
  ) {
    setIsPending(true);
    setError(null);

    updateRouteRequest(routeId, formValue)
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
