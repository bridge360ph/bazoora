import dotenv from "dotenv";
dotenv.config();

import Fastify from "fastify";
import cors from "@fastify/cors";
import type { HealthResponse } from "@bazoora/shared";

import { setupSocket } from "./plugins/socket.js";

import { authRoutes } from "./routes/auth.js";
import { trucksRoutes } from "./routes/trucks.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
  credentials: true,
});

// Register API routes
await app.register(authRoutes, {
  prefix: "/auth",
});

await app.register(trucksRoutes, {
  prefix: "/trucks",
});

// Health check
app.get("/", (): HealthResponse => {
  return {
    status: "ok",
  };
});

// Start server
await app.listen({
  port: Number(process.env.PORT ?? 3000),
  host: "0.0.0.0",
});

// Initialize Socket.IO after HTTP server starts
setupSocket(app.server);