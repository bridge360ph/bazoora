import type { FastifyInstance } from "fastify";

import type { UpdateRouteStatusRequest } from "@bazoora/shared";

import {
  authGuard,
  requireRole,
} from "../lib/auth.js";
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
  getRouteAssignment,
  getRouteById,
  getRouteForUser,
  getRoutes,
  updateRoute,
  updateRouteStatus,
} from "../services/routeManagementService.js";

const routeReadRoles = [
  "SUPER_ADMIN",
  "GOVERNMENT_ADMIN",
  "HAULING_ADMIN",
  "DRIVER",
  "ECO_AIDE",
] as const;

const routeAdminRoles = [
  "SUPER_ADMIN",
  "GOVERNMENT_ADMIN",
  "HAULING_ADMIN",
] as const;

const routeStatusUpdateRoles = [
  "SUPER_ADMIN",
  "GOVERNMENT_ADMIN",
  "HAULING_ADMIN",
  "DRIVER",
  "ECO_AIDE",
] as const;

export function routeManagementRoutes(
  app: FastifyInstance,
): void {
  app.get(
    "/",
    {
      preHandler: [
        authGuard,
        requireRole(...routeReadRoles),
      ],
    },
    () => {
      return getRoutes();
    },
  );

  app.get(
    "/me",
    {
      preHandler: [
        authGuard,
        requireRole("DRIVER", "ECO_AIDE"),
      ],
    },
    async (request, reply) => {
      const route = await getRouteForUser(
        request.user.sub,
        request.user.role,
      );

      if (!route) {
        return reply.status(404).send({
          message: "No route is assigned to you",
        });
      }

      return reply.send(route);
    },
  );

  app.get(
    "/:id",
    {
      schema: routeManagementParamsSchema,
      preHandler: [
        authGuard,
        requireRole(...routeReadRoles),
      ],
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
      preHandler: [
        authGuard,
        requireRole(...routeAdminRoles),
      ],
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
      preHandler: [
        authGuard,
        requireRole(...routeStatusUpdateRoles),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as {
        id: string;
      };

      const assignment = await getRouteAssignment(id);

      if (!assignment) {
        return reply.status(404).send({
          message: "Route not found",
        });
      }

      const user = request.user;
      const isAdmin = routeAdminRoles.includes(
        user.role as (typeof routeAdminRoles)[number],
      );

      // Operational roles may only move a route they are actually on. The
      // owner is resolved per role and the check denies by default, so a role
      // added to routeStatusUpdateRoles later without an ownership rule here
      // is refused rather than waved through.
      if (!isAdmin) {
        const ownerId =
          user.role === "ECO_AIDE"
            ? assignment.assignedEcoAideId
            : user.role === "DRIVER"
              ? assignment.assignedDriverId
              : null;

        if (!ownerId || ownerId !== user.sub) {
          return reply.status(403).send({
            message: "You are not assigned to this route",
          });
        }
      }

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
      preHandler: [
        authGuard,
        requireRole(...routeAdminRoles),
      ],
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
