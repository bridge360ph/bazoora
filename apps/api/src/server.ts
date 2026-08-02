import "dotenv/config";

import Fastify from "fastify";
import cors from "@fastify/cors";
import type { HealthResponse } from "@bazoora/shared";

import { setupSocket } from "./plugins/socket.js";
import { haulingRequestRoutes } from "./routes/haulingRequestRoutes.js";
import { authRoutes } from "./routes/auth.js";
import { locationRoutes } from "./routes/locationRoutes.js";
import { config } from "./plugins/config.js";

const app = Fastify({ logger: true });

const start = async () => {
  await app.register(cors, {
    origin: config.corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  });

  // Authentication routes
  await app.register(authRoutes, {
    prefix: "/auth",
  });

  // Hauling request routes
  await app.register(haulingRequestRoutes, {
    prefix: "/hauling-requests",
  });

  // Philippine reference location routes
  await app.register(locationRoutes, {
    prefix: "/locations",
  });

  app.get("/", (): HealthResponse => {
    return { status: "ok" };
  });

  // Socket.IO
  setupSocket(app.server);

  await app.listen({
    port: config.port,
    host: "0.0.0.0",
  });
};

start().catch((err) => {
  app.log.error(err);
  process.exit(1);
});