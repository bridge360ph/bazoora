import { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";

export function setupSocket(server: HttpServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    },
  });

  return io;
}