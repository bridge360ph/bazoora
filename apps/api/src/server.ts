import dotenv from "dotenv";
dotenv.config();

import Fastify from "fastify";
import cors from "@fastify/cors";
import type { HealthResponse } from "@bazoora/shared";

import { setupSocket } from "./plugins/socket.js";
import { haulingRequestRoutes } from "./routes/haulingRequestRoutes.js";
import { config } from "./plugins/config.js";

import { authRoutes } from "./routes/auth.js";
import { trucksRoutes } from "./routes/trucks.js";

const app = Fastify({ logger: true });

const start = async () => {
  await app.register(cors, {
    origin: config.corsOrigin,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  });

  // Keep your auth route
  await app.register(authRoutes, {
    prefix: "/auth",
  });

  // Keep existing truck routes if they still exist in your branch
  await app.register(trucksRoutes, {
    prefix: "/trucks",
  });

  // Keep development's hauling request routes
  await app.register(haulingRequestRoutes, {
    prefix: "/hauling-requests",
  });

  app.get("/", (): HealthResponse => {
    return { status: "ok" };
  });

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