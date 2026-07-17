import type { FastifyInstance } from "fastify";

import type {
  CreateRouteBody,
  UpdateRouteBody,
} from "../schemas/routeManagement.schema.js";

import {
  routeManagementParamsSchema,
  createRouteSchema,
  updateRouteSchema,
} from "../schemas/routeManagement.schema.js";

import {
  createRoute,
  getRouteById,
  getRoutes,
  updateRoute,
} from "../services/routeManagementService.js";


export function routeManagementRoutes(
  app: FastifyInstance,
) {
  app.post(
    "/",
    {
      schema: createRouteSchema,
    },
    async (request, reply) => {
      const body = request.body as CreateRouteBody;

      try {
        return await createRoute(body);
      } catch (error) {
        return reply.status(400).send({
          message: (error as Error).message,
        });
      }
    },
  );


  app.get("/", () => {
      return getRoutes();
    },
  );


  app.get(
    "/:id",
    {
      schema: routeManagementParamsSchema,
    },
    async (request) => {
      const { id } = request.params as {
        id: string;
      };

      return getRouteById(id);
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
        return await updateRoute(id, body);
      } catch (error) {
        return reply.status(404).send({
          message: (error as Error).message,
        });
      }
    },
  );
}