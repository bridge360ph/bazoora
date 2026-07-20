import "dotenv/config";

import Fastify from "fastify";
import cors from "@fastify/cors";
import type { HealthResponse } from "@bazoora/shared";

import { setupSocket } from "./plugins/socket.js";
import { haulingRequestRoutes } from "./routes/haulingRequestRoutes.js";
import { routeManagementRoutes } from "./routes/routeManagementRoutes.js";
import { trucksRoutes } from "./routes/trucks.js";
import { config } from "./plugins/config.js";

const app = Fastify({ logger: true });

const start = async () => {
  await app.register(cors, {
    origin: config.corsOrigin,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  });

  await app.register(haulingRequestRoutes, {
    prefix: "/hauling-requests",
  });

  await app.register(routeManagementRoutes, {
    prefix: "/routes",
  });
  
  await app.register(trucksRoutes, {
    prefix: "/trucks",
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
