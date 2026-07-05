import Fastify from "fastify";
import cors from "@fastify/cors";
import type { HealthResponse } from "@bazoora/shared";

const app = Fastify({ logger: true });

const start = async () => {
  await app.register(cors, {
    origin: true,
  });

  app.get("/", (): HealthResponse => {
    return { status: "ok" };
  });

  // With the logger enabled, Fastify logs the listening address itself.
  await app.listen({
    port: 3000,
    host: "0.0.0.0",
  });
};

start().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
