import Fastify from "fastify";
import cors from "@fastify/cors";
import type { HealthResponse } from "@bazoora/shared";
import { ecoAideRoutes } from "./features/eco-aides/ecoAide.routes.js";

const app = Fastify({ logger: true });

const start = async () => {
  await app.register(cors, {
    origin: true,
  });

  app.get("/", (): HealthResponse => {
    return { status: "ok" };
  });

  await app.register(ecoAideRoutes, {
    prefix: "/api",
  });

  await app.listen({
    port: Number(process.env.PORT ?? 3000),
    host: "0.0.0.0",
  });
};

start().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});