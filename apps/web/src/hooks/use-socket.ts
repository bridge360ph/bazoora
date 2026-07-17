"use client";

import { useEffect, useState } from "react";

import { getSocket, type BazooraSocket } from "@/lib/socket";
import { useAuthStore } from "@/stores/auth-store";

interface UseSocketOptions {
  /** Connect immediately on mount. Defaults to true when the user is signed in. */
  autoConnect?: boolean;
}

interface UseSocketReturn {
  socket: BazooraSocket;
  isConnected: boolean;
}

/**
 * Thin wrapper around the singleton socket. Keeps the auth token fresh by
 * reading from the store on every connect attempt.
 */
export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const { autoConnect = true } = options;
  const accessToken = useAuthStore((s) => s.accessToken);
  const [isConnected, setIsConnected] = useState(false);
  const [socket] = useState<BazooraSocket>(() =>
    getSocket(() => useAuthStore.getState().accessToken),
  );

  useEffect(() => {
    const handleConnect = (): void => {
      setIsConnected(true);
    };
    const handleDisconnect = (): void => {
      setIsConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (autoConnect && accessToken && !socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [autoConnect, accessToken, socket]);

  return {
    socket,
    isConnected,
  };
}
