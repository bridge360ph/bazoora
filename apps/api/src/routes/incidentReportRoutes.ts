import type { FastifyPluginCallback } from "fastify";
import type {
  CreateIncidentReportInput,
  PresignedUploadUrlRequest,
} from "@bazoora/shared";
import { authGuard, requireRole } from "../lib/auth.js";
import {
  createIncidentReport,
  getIncidentReportsByUser,
  generateUploadPresignedUrl,
} from "../services/incidentReportService.js";

const allowedRoles = [
  "ECO_AIDE",
  "DRIVER",
  "SUPER_ADMIN",
  "GOVERNMENT_ADMIN",
  "HAULING_ADMIN",
] as const;

export const incidentReportRoutes: FastifyPluginCallback = (
  app,
  _opts,
  done,
) => {
  // GET ALL INCIDENTS FILED BY AUTHENTICATED USER
  app.get(
    "/me",
    {
      preHandler: [authGuard, requireRole(...allowedRoles)],
    },
    async (request) => {
      return await getIncidentReportsByUser(request.user.sub);
    },
  );

  // CREATE INCIDENT REPORT 
  app.post(
    "/",
    {
      bodyLimit: 15 * 1024 * 1024, // ALLOW UP TO 15MB FOR BASE64 PAYLOADS
      preHandler: [authGuard, requireRole(...allowedRoles)],
    },
    async (request, reply) => {
      const body = request.body as CreateIncidentReportInput;

      if (!body?.category || !body?.description) {
        return reply.status(400).send({
          message: "Category and description are required fields",
        });
      }

      const report = await createIncidentReport(body, request.user.sub);
      return reply.status(201).send(report);
    },
  );

  // GENERATE PRESIGNED S3 UPLOAD URL FOR ATTACHMENT
  app.post(
    "/presigned-url",
    {
      preHandler: [authGuard, requireRole(...allowedRoles)],
    },
    async (request, reply) => {
      const { fileName, fileType } = request.body as PresignedUploadUrlRequest;

      if (!fileName || !fileType) {
        return reply.status(400).send({
          message: "fileName and fileType are required",
        });
      }

      try {
        const presignedData = await generateUploadPresignedUrl(fileName, fileType);
        return reply.send(presignedData);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          message: "Could not generate presigned upload target",
        });
      }
    },
  );

  done();
};