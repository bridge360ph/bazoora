import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import type { HealthResponse } from "@bazoora/shared";
import { haulingRequestRoutes } from "./routes/haulingRequestRoutes.js";
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

app.get("/", (): HealthResponse => {
  return { status: "ok" };
});

  await app.listen({
    port: config.port,
    host: "0.0.0.0",
  });
};

// TODO: Add Socket.IO connection handlers/events.
setupSocket(app.server);

await app.listen({
  port: Number(process.env.PORT ?? 3000),
  host: "0.0.0.0",
});