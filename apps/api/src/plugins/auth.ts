import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import type { FastifyPluginAsync } from "fastify";
import fastifyPlugin from "fastify-plugin";

import { config } from "./config.js";

const registerAuth: FastifyPluginAsync = async (app) => {
  await app.register(cookie);

  await app.register(jwt, {
    secret: config.authSecret,
    sign: {
      expiresIn: config.accessTokenExpiresIn,
    },
  });
};

export const authPlugin = fastifyPlugin(registerAuth, {
  name: "auth",
});
