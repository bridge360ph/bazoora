import Fastify from "fastify";
import cors from "@fastify/cors";
import type { HealthResponse } from "@bazoora/shared";

const app = Fastify();

const start = async () => {
  await app.register(cors, {
    origin: true,
  });

  app.get("/", (): HealthResponse => {
    return { status: "ok" };
  });

  await app.listen({
    port: 3000,
    host: "0.0.0.0",
  });

  console.log("Server running on http://localhost:3000");
};

start().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
