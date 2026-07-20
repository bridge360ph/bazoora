import { useState } from "react";
import type { Route } from "@bazoora/shared";
import type { RouteFormValue } from "../route.types.ts";
import { createRouteRequest } from "../routeService";

interface UseCreateRouteOptions {
  onSuccess?: (route: Route) => void;
}

interface UseCreateRouteResult {
  mutate: (formValue: RouteFormValue, options?: UseCreateRouteOptions) => void;
  isPending: boolean;
  error: Error | null;
}

export function useCreateRoute(): UseCreateRouteResult {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  function mutate(formValue: RouteFormValue, options?: UseCreateRouteOptions) {
    setIsPending(true);
    setError(null);

    createRouteRequest(formValue)
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
