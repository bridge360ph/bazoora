import { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function setupSocket(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
      credentials: true,
    },
  });

  return io;
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
  if (!io) return;

  io.to(`org:${orgId}`).emit("truck:location", payload);
}