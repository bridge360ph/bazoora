import { useEffect, useState } from "react";

import { useAuthStore } from "@/stores/auth-store";
import { fetchMe } from "./authApi";

/**
 * On app load, validate any persisted session before rendering guarded routes.
 *
 * If a persisted access token exists we call GET /auth/me. When it 401s the
 * api-client interceptor attempts a single silent /auth/refresh; if that also
 * fails the store is cleared. Either way the user is re-hydrated from the
 * server so guards never act on stale cookie data.
 *
 * Returns `false` while bootstrapping so the app can hold rendering (a loader)
 * until the session is resolved, avoiding a redirect flash.
 */
export function useSessionBootstrap(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap(): Promise<void> {
      const token = useAuthStore.getState().accessToken;

      if (!token) {
        if (!cancelled) {
          setReady(true);
        }
        return;
      }

      try {
        const user = await fetchMe();
        if (!cancelled) {
          const { accessToken, rememberMeLoggedIn, setSession } = useAuthStore.getState();
          // The interceptor may have refreshed the token during this call, so
          // read it back from the store rather than reusing the stale value.
          if (accessToken) {
            setSession(user, accessToken, rememberMeLoggedIn);
          } else {
            useAuthStore.getState().clear();
          }
        }
      } catch {
        if (!cancelled) {
          useAuthStore.getState().clear();
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}
