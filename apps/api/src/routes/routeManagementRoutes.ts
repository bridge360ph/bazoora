import type { FastifyInstance } from "fastify";

import type { UpdateRouteStatusRequest } from "@bazoora/shared";

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
  });

  app.get(
    "/:id",
    {
      schema: routeManagementParamsSchema,
    },
    async (request, reply) => {
      const { id } = request.params as {
        id: string;
      };

      const route = await getRouteById(id);

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
    async (request, reply) => {
      const body = request.body as CreateRouteBody;

      try {
        const route = await createRoute(body);

        if (!route) {
          return reply.status(409).send({
            message: "Route already exists",
          });
        }

        return reply.send(route);
      } catch (error) {
        return reply.status(400).send({
          message: (error as Error).message,
        });
      }
    },
  );

  app.patch(
    "/:id/status",
    {
      schema: updateRouteStatusSchema,
    },
    async (request, reply) => {
      const { id } = request.params as {
        id: string;
      };

      const { status } =
        request.body as UpdateRouteStatusRequest;

      const route = await updateRouteStatus(
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
      schema: {
        ...routeManagementParamsSchema,
        ...updateRouteSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params as {
        id: string;
      };

      const body = request.body as UpdateRouteBody;

      try {
        const route = await updateRoute(
          id,
          body,
        );

        if (!route) {
          return reply.status(404).send({
            message: "Route not found",
          });
        }

        return reply.send(route);
      } catch (error) {
        return reply.status(400).send({
          message: (error as Error).message,
        });
      }
    },
  );
}