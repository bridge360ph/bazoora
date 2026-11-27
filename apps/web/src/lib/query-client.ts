import axios from "axios";
import { QueryClient } from "@tanstack/react-query";

/**
 * How long fetched data counts as fresh. Within this window, going back to
 * a page or refocusing the tab reuses the cached data instead of downloading
 * it again. Mutations still refresh what they change by invalidating their
 * queries, and individual queries can override this (polling, address lists).
 */
export const DEFAULT_STALE_TIME_MS = 30_000;

/**
 * Retry a failed query at most once, and never for 4xx responses: a
 * permission or validation error will not fix itself, so retrying only
 * delays the error message (React Query's default is 3 retries, ~7s).
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  const status = findHttpStatus(error);

  if (status !== undefined && status >= 400 && status < 500) {
    return false;
  }

  return failureCount < 1;
}

/**
 * The HTTP status behind an error. Feature API modules often wrap axios
 * errors to show the server's message, so this also looks through `cause`.
 */
function findHttpStatus(error: unknown): number | undefined {
  let current: unknown = error;

  for (let depth = 0; depth < 5 && current !== undefined; depth += 1) {
    if (axios.isAxiosError(current)) {
      return current.response?.status;
    }

    current = current instanceof Error ? current.cause : undefined;
  }

  return undefined;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME_MS,
        retry: shouldRetryQuery,
      },
    },
  });
}
