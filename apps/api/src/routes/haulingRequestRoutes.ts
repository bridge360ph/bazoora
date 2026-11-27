import type { FastifyPluginCallback, FastifyReply } from "fastify";
import type {
  AssignHaulingRequestRouteInput,
  CreateHaulingRequestInput,
  PresignedUploadUrlRequest,
} from "@bazoora/shared";

import {
  authGuard,
  requireRole,
} from "../lib/auth.js";
import { UnsupportedUploadTypeError } from "../lib/s3ImageUpload.js";
import {
  assignHaulingRequestRouteSchema,
  createHaulingRequestSchema,
  denyHaulingRequestSchema,
  haulingRequestParamsSchema,
  haulingRequestPhotoUploadSchema,
} from "../schemas/haulingRequest.schema.js";
import {
  approveHaulingRequest,
  assignHaulingRequestRoute,
  createHaulingRequest,
  createHaulingRequestPhotoUpload,
  denyHaulingRequest,
  getHaulingRequests,
  getHaulingRouteOptions,
  HaulingRequestNotPendingError,
  HaulingRouteError,
  InvalidDenialReasonError,
} from "../services/haulingRequestService.js";

const adminRoles = [
  "SUPER_ADMIN",
  "GOVERNMENT_ADMIN",
  "HAULING_ADMIN",
] as const;

const requesterRoles = ["RESIDENT", "BUSINESS"] as const;

/**
 * Maps the expected approve/deny failures to client errors. Anything else is
 * rethrown so Fastify reports it as a 500 instead of hiding it behind a 400.
 */
async function sendDecisionError(reply: FastifyReply, error: unknown) {
  if (error instanceof HaulingRequestNotPendingError) {
    return reply.status(409).send({ message: error.message });
  }

  if (error instanceof InvalidDenialReasonError) {
    return reply.status(400).send({ message: error.message });
  }

  if (error instanceof HaulingRouteError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  throw error;
}

/**
 * Approve takes an optional { routeId } body. Existing callers send no body
 * at all, so it is read by hand instead of through a required body schema.
 */
function readOptionalRouteId(body: unknown): string | null | undefined {
  if (body === null || typeof body !== "object" || !("routeId" in body)) {
    return undefined;
  }

  const { routeId } = body;

  if (routeId === null || typeof routeId === "string") {
    return routeId === "" ? null : routeId;
  }

  return undefined;
}

export const haulingRequestRoutes: FastifyPluginCallback = (
  app,
  _opts,
  done,
) => {
  app.get(
    "/",
    {
      preHandler: [
        authGuard,
        requireRole(...adminRoles),
      ],
    },
    async () => {
      return await getHaulingRequests();
    },
  );

  app.get(
    "/me",
    {
      preHandler: [
        authGuard,
        requireRole(...requesterRoles),
      ],
    },
    async (request) => {
      return await getHaulingRequests(request.user.sub);
    },
  );

  app.post(
    "/",
    {
      schema: createHaulingRequestSchema,
      preHandler: [
        authGuard,
        requireRole(...requesterRoles),
      ],
    },
    async (request) => {
      const body = request.body as CreateHaulingRequestInput;

      // The sender type follows the account, not the request body, so a
      // business account is always filed as BUSINESS.
      return await createHaulingRequest(
        {
          ...body,
          senderType: request.user.role === "BUSINESS" ? "BUSINESS" : "RESIDENT",
        },
        request.user.sub,
      );
    },
  );

  // PRESIGNED S3 UPLOAD TARGET FOR A HAULING REQUEST PHOTO
  app.post(
    "/presigned-url",
    {
      schema: haulingRequestPhotoUploadSchema,
      preHandler: [
        authGuard,
        requireRole(...requesterRoles),
      ],
    },
    async (request, reply) => {
      const { fileType } = request.body as PresignedUploadUrlRequest;

      try {
        return await createHaulingRequestPhotoUpload(fileType);
      } catch (error) {
        if (error instanceof UnsupportedUploadTypeError) {
          return reply.status(400).send({
            message: "Only JPEG, PNG, WebP and HEIC images can be attached",
          });
        }

        request.log.error(error);
        return reply.status(500).send({
          message: "Could not generate presigned upload target",
        });
      }
    },
  );

  app.patch(
    "/:id/approve",
    {
      schema: haulingRequestParamsSchema,
      preHandler: [
        authGuard,
        requireRole(...adminRoles),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      try {
        const result = await approveHaulingRequest(
          id,
          request.user.sub,
          readOptionalRouteId(request.body),
        );

        if (!result) {
          return reply.status(404).send({
            message: "Hauling request not found",
          });
        }

        return result;
      } catch (error) {
        return sendDecisionError(reply, error);
      }
    },
  );

  app.patch(
    "/:id/deny",
    {
      schema: denyHaulingRequestSchema,
      preHandler: [
        authGuard,
        requireRole(...adminRoles),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { denialReason } = request.body as { denialReason: string };

      try {
        const result = await denyHaulingRequest(
          id,
          denialReason,
          request.user.sub,
        );

        if (!result) {
          return reply.status(404).send({
            message: "Hauling request not found",
          });
        }

        return result;
      } catch (error) {
        return sendDecisionError(reply, error);
      }
    },
  );

  app.get(
    "/:id/route-options",
    {
      schema: haulingRequestParamsSchema,
      preHandler: [
        authGuard,
        requireRole(...adminRoles),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const options = await getHaulingRouteOptions(id);

      if (!options) {
        return reply.status(404).send({
          message: "Hauling request not found",
        });
      }

      return options;
    },
  );

  app.patch(
    "/:id/route",
    {
      schema: assignHaulingRequestRouteSchema,
      preHandler: [
        authGuard,
        requireRole(...adminRoles),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { routeId } = request.body as AssignHaulingRequestRouteInput;

      try {
        const result = await assignHaulingRequestRoute(
          id,
          routeId,
          request.user.sub,
        );

        if (!result) {
          return reply.status(404).send({
            message: "Hauling request not found",
          });
        }

        return result;
      } catch (error) {
        return sendDecisionError(reply, error);
      }
    },
  );

  done();
};
