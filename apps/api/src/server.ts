import Fastify from "fastify";
import cors from "@fastify/cors";
import type { HealthResponse } from "@bazoora/shared";
import { setupSocket } from "./plugins/socket.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
});

app.get("/", (): HealthResponse => {
  return { status: "ok" };
});

await app.listen({
  port: Number(process.env.PORT ?? 3000),
  host: "0.0.0.0",
});

setupSocket(app.server);