import Fastify from "fastify";
import cors from "@fastify/cors";

const app = Fastify();

const start = async () => {
  await app.register(cors, {
    origin: true,
  });

  app.get("/", async () => {
    return { status: "ok" };
  });

  await app.listen({
    port: 3000,
    host: "0.0.0.0",
  });

  console.log("Server running on http://localhost:3000");
};

start();