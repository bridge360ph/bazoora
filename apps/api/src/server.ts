import "dotenv/config";

import Fastify from "fastify";
import cors from "@fastify/cors";
import type { HealthResponse } from "@bazoora/shared";
import { haulingRequestRoutes } from "./routes/haulingRequestRoutes.js";
import { setupSocket } from "./plugins/socket.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
});

app.get("/", (): HealthResponse => {
  return { status: "ok" };
});

// TODO: Add Socket.IO connection handlers/events.
setupSocket(app.server);

start().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});

await app.register(
  haulingRequestRoutes,
  {
    prefix: "/hauling-requests",
  },
);
await app.listen({
  port: Number(process.env.PORT ?? 3000),
  host: "0.0.0.0",
});
