import { useEffect, useState } from "react";
import type { RouteTruckOption } from "@bazoora/shared";
import { fetchTruckOptions } from "../routeAssignmentApi";

interface UseTruckOptionsResult {
  trucks: RouteTruckOption[];
  isLoading: boolean;
  isError: boolean;
}

export function useTruckOptions(): UseTruckOptionsResult {
  const [trucks, setTrucks] = useState<RouteTruckOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetchTruckOptions()
      .then((data) => {
        if (isMounted) {
          setTrucks(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsError(true);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { trucks, isLoading, isError };
}
