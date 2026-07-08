import dotenv from "dotenv";
dotenv.config();

import Fastify from "fastify";
import cors from "@fastify/cors";
import type { HealthResponse } from "@bazoora/shared";
import { setupSocket } from "./plugins/socket.js";
import { trucksRoutes } from "./routes/trucks.js";
import { authRoutes } from "./routes/auth.js";
import { notificationsRoutes } from "./routes/notifications.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
  credentials: true,
});

// Register routes
await app.register(trucksRoutes, { prefix: "/trucks" });
await app.register(authRoutes, { prefix: "/auth" });
await app.register(notificationsRoutes, { prefix: "/notifications" });

app.get("/", (): HealthResponse => {
  return { status: "ok" };
});

await app.listen({
  port: Number(process.env.PORT ?? 3000),
  host: "0.0.0.0",
});

setupSocket(app.server);