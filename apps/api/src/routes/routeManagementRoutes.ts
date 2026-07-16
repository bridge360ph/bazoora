import type { FastifyInstance } from "fastify";

import type {
  CreateRouteBody,
  UpdateRouteBody,
} from "../schemas/routeManagement.schema.js";

import {
  createRouteSchema,
  routeManagementParamsSchema,
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

      return route;
    },
  );


  app.post(
    "/",
    {
      schema: createRouteSchema,
    }, (request) => {
      const body = request.body as CreateRouteBody;

      return createRoute(body);
    },
  );

  
  app.patch(
    "/:id",
    {
      schema: updateRouteSchema,
    }, (request) => {
      const { id } = request.params as {
        id: string;
      };

      const body = request.body as UpdateRouteBody;

      return updateRoute(
        id,
        body,
      );
    },
  );
}