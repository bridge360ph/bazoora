import "dotenv/config";

import Fastify from "fastify";
import cors from "@fastify/cors";
import type { HealthResponse } from "@bazoora/shared";

import { setupSocket } from "./plugins/socket.js";
import { haulingRequestRoutes } from "./routes/haulingRequestRoutes.js";
import { routeManagementRoutes } from "./routes/routeManagementRoutes.js";
import { trucksRoutes } from "./routes/trucks.js";
import { analyticsRoutes } from "./routes/analyticsRoutes.js";
import { config } from "./plugins/config.js";
import { authPlugin } from "./plugins/auth.js";
import { authRoutes } from "./routes/authRoutes.js";

const app = Fastify({
  logger: true,
  ignoreTrailingSlash: true,
  ajv: {
    customOptions: {
      removeAdditional: false,
    },
  },
});

const start = async () => {
  await app.register(cors, {
    origin: config.corsOrigin,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  });

  await app.register(authPlugin);

  await app.register(authRoutes, {
    prefix: "/auth",
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

  await app.register(analyticsRoutes, {
    prefix: "/analytics",
  });

  app.get("/", (): HealthResponse => {
    return { status: "ok" };
  });

  setupSocket(
    app.server,
    (token) => app.jwt.verify(token),
  );

  await app.listen({
    port: config.port,
    host: "0.0.0.0",
  });
};

start().catch((err) => {
  app.log.error(err);
  process.exit(1);
});
