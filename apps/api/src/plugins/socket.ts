/* eslint-disable */
import { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { verifyAccessToken } from "../lib/jwt.js";

export let io: SocketIOServer;

export function setupSocket(server: HttpServer): SocketIOServer {
  const socketIO = new SocketIOServer(server, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  io = socketIO;

  // Middleware for checking handshake tokens
  socketIO.use((socket, next) => {
    const rawToken = (socket.handshake.auth as { token?: unknown } | undefined)?.token;

    if (typeof rawToken !== "string" || rawToken.length === 0) {
      next(new Error("Missing auth token"));
      return;
    }

    try {
      const payload = verifyAccessToken(rawToken);
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
      socket.data.organizationId = payload.organizationId;
      next();
    } catch {
      next(new Error("Invalid access token"));
    }
  });

  socketIO.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}, User: ${socket.data.userId}`);

    socket.on("truck:subscribe", ({ orgId }) => {
      void socket.join(`org:${orgId}`);
    });

    socket.on("truck:unsubscribe", ({ orgId }) => {
      void socket.leave(`org:${orgId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id}, Reason: ${reason}`);
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
  }
): void {
  if (io) {
    io.to(`org:${orgId}`).emit("truck:location", payload);
  }
}