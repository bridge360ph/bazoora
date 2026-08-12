import { useEffect, useState } from "react";
import type { UserSummary } from "@bazoora/shared";
import { fetchEcoAideUsers } from "../routeAssignmentApi";

interface UseEcoAideOptionsResult {
  ecoAides: UserSummary[];
  isLoading: boolean;
  isError: boolean;
}

export function useEcoAideOptions(): UseEcoAideOptionsResult {
  const [ecoAides, setEcoAides] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetchEcoAideUsers()
      .then((data) => {
        if (isMounted) {
          setEcoAides(data);
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

  return { ecoAides, isLoading, isError };
}
