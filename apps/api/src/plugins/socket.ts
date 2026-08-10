import type { Server as HttpServer } from "node:http";

import type { UserRole } from "@bazoora/db";
import { Server as SocketIOServer } from "socket.io";

interface SocketAccessTokenPayload {
  sub: string;
  role: UserRole;
}

interface ServerToClientEvents {
  "truck:location": (payload: {
    truckId: string;
    lat: number;
    lng: number;
    timestamp: string;
  }) => void;
}

interface ClientToServerEvents {
  "truck:subscribe": (payload: { orgId?: unknown }) => void;
  "truck:unsubscribe": (payload: { orgId?: unknown }) => void;
}

type InterServerEvents = Record<never, never>;

interface SocketData {
  userId: string;
  role: UserRole;
  organizationId: string;
}

type VerifySocketAccessToken = (
  token: string,
) => SocketAccessTokenPayload;

type BazooraSocketServer = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export let io: BazooraSocketServer;

export function setupSocket(
  server: HttpServer,
  verifyAccessToken: VerifySocketAccessToken,
): BazooraSocketServer {
  const allowedOrigins = (
    process.env.CORS_ORIGIN ?? "http://localhost:5173"
  )
    .split(",")
    .map((origin) => origin.replace(/['"]/g, "").trim())
    .filter(Boolean);

  const socketIO = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io = socketIO;

  socketIO.use((socket, next) => {
    const handshakeAuth = socket.handshake.auth as
      | { token?: unknown }
      | undefined;

    const rawToken = handshakeAuth?.token;

    if (typeof rawToken !== "string" || rawToken.length === 0) {
      next(new Error("Missing auth token"));
      return;
    }

    try {
      const payload = verifyAccessToken(rawToken);

      socket.data.userId = payload.sub;
      socket.data.role = payload.role;

      // The database does not yet have an organization model.
      socket.data.organizationId = "org-1";

      next();
    } catch {
      next(new Error("Invalid access token"));
    }
  });

  socketIO.on("connection", (socket) => {
    socket.on("truck:subscribe", ({ orgId }) => {
      if (
        typeof orgId !== "string" ||
        orgId !== socket.data.organizationId
      ) {
        return;
      }

      void socket.join(`org:${orgId}`);
    });

    socket.on("truck:unsubscribe", ({ orgId }) => {
      if (
        typeof orgId !== "string" ||
        orgId !== socket.data.organizationId
      ) {
        return;
      }

      void socket.leave(`org:${orgId}`);
    });
  });

  return socketIO;
}

export function emitTruckLocation(
  orgId: string,
  payload: {
    truckId: string;
    lat: number;
    lng: number;
    timestamp: string;
  },
): void {
  if (io) {
    io.to(`org:${orgId}`).emit("truck:location", payload);
  }
}
