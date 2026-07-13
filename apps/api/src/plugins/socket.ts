import { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

export function setupSocket(server: HttpServer): Server {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
      credentials: true,
    },
  });

  return io;
}