import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/stores/auth-store";
import { logout } from "./authApi";

/**
 * Signs the user out everywhere it matters:
 * 1. POST /auth/logout revokes the refresh token and clears its cookie.
 *    Without this, the next 401 silently refreshes back into the old account.
 * 2. Clears the React Query cache so the next user never sees the previous
 *    user's notifications or other cached data.
 * 3. Clears the local session (store + auth cookie).
 */
export function useSignOut(): () => Promise<void> {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((s) => s.clear);

  return useCallback(async () => {
    try {
      await logout();
    } finally {
      // Clear local state even if the logout request fails, so a failed
      // request can never leave someone signed in on a shared machine.
      queryClient.clear();
      clearSession();
    }
  }, [queryClient, clearSession]);
}
