import type { FastifyInstance } from "fastify";

import type {
  UpdateRouteStatusRequest,
} from "@bazoora/shared";

import type {
  CreateRouteBody,
  UpdateRouteBody,
} from "../schemas/routeManagement.schema.js";

import {
  createRouteSchema,
  routeManagementParamsSchema,
  updateRouteSchema,
  updateRouteStatusSchema,
} from "../schemas/routeManagement.schema.js";

import {
  createRoute,
  getRouteById,
  getRoutes,
  updateRoute,
  updateRouteStatus,
} from "../services/routeManagementService.js";

  
export function routeManagementRoutes(
  app: FastifyInstance,
) {

  app.get("/", () => {
      return getRoutes();
    },
  );


  app.get(
    "/:id",
    {
      schema: routeManagementParamsSchema,
    },
    (request, reply) => {
      const { id } = request.params as {
        id: string;
      };

      const route = getRouteById(id);

      if (!route) {
        return reply.status(404).send({
          message: "Route not found",
        });
      }

      return reply.send(route);
    },
  );


  app.post(
    "/",
    {
      schema: createRouteSchema,
    },
    (request, reply) => {
      const body = request.body as CreateRouteBody;

      const route = createRoute(body);

      if (!route) {
        return reply.status(409).send({
          message: "Route already exists",
        });
      }

      return reply.send(route);
    },
  );

  app.patch(
    "/:id/status",
    {
      schema: updateRouteStatusSchema,
    },
    (request, reply) => {
      const { id } = request.params as {
        id: string;
      };

      const { status } =
        request.body as UpdateRouteStatusRequest;

      const route = updateRouteStatus(
        id,
        status,
      );

      if (!route) {
        return reply.status(404).send({
          message: "Route not found",
        });
      }

      return reply.send(route);
    },
  );

  app.patch(
    "/:id",
    {
      schema: updateRouteSchema,
    },
    (request, reply) => {
      const { id } = request.params as {
        id: string;
      };

      const body = request.body as UpdateRouteBody;

      const route = updateRoute(
        id,
        body,
      );

      if (!route) {
        return reply.status(404).send({
          message: "Route not found",
        });
      }

      return reply.send(route);
    },
  );
}