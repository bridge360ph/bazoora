import { io, type Socket } from "socket.io-client";

import { env } from "@/lib/env";

/**
 * Typed socket events. Mirror this shape on the server in
 * `bazoora-api/src/socket/events.ts` so both sides stay in sync.
 */
export interface ServerToClientEvents {
  "truck:location": (payload: {
    truckId: string;
    lat: number;
    lng: number;
    timestamp: string;
  }) => void;
  "notification:new": (payload: {
    notificationId: string;
  }) => void;
  connect_error: (error: Error) => void;
}

export interface ClientToServerEvents {
  "truck:subscribe": (payload: { orgId: string }) => void;
  "truck:unsubscribe": (payload: { orgId: string }) => void;
}

export type BazooraSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: BazooraSocket | null = null;

/**
 * Returns a singleton socket on the client. Must be called inside a client
 * component (or `useSocket`). The JWT is read lazily on each connect so the
 * current token is used after a refresh.
 */
export function getSocket(getToken: () => string | null): BazooraSocket {
  if (socket) return socket;

  socket = io(env.NEXT_PUBLIC_SOCKET_URL, {
    autoConnect: false,
    transports: ["websocket"],
    auth: (cb) => {
      cb({ token: getToken() ?? "" });
    },
  });

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
