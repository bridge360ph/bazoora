import type { FastifyPluginAsync } from "fastify";
import { prisma } from "@bazoora/db";
import { authGuard, requireRole } from "../lib/auth.js";

const AUDIENCE_ROLES: Record<string, string[]> = {
  "All Users": [
    "SUPER_ADMIN",
    "GOVERNMENT_ADMIN",
    "HAULING_ADMIN",
    "DRIVER",
    "ECO_AIDE",
    "BUSINESS",
    "RESIDENT",
  ],
  Residents: ["RESIDENT"],
  Businesses: ["BUSINESS"],
  "Eco-Aides": ["ECO_AIDE"],
  "Fleet Drivers": ["DRIVER"],
};

export const notificationRoutes: FastifyPluginAsync = async (app) => {
  await Promise.resolve();
  app.get(
    "/",
    {
      preHandler: [
        authGuard,
        requireRole(
          "SUPER_ADMIN",
          "GOVERNMENT_ADMIN",
          "HAULING_ADMIN",
        ),
      ],
    },
    async () => {
      const notifications = await prisma.notification.findMany({
        orderBy: {
          createdAt: "desc",
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          receipts: {
            select: {
              readAt: true,
            },
          },
        },
      });

      const data = notifications.map((notification) => {
        const totalRecipients = notification.receipts.length;
        const totalReads = notification.receipts.filter(
          (receipt) => receipt.readAt !== null,
        ).length;

        return {
          id: notification.id,
          type: notification.type,
          audience: notification.audience,
          title: notification.title,
          message: notification.message,
          createdAt: notification.createdAt,
          createdBy: notification.createdBy,
          totalRecipients,
          totalReads,
          readRate:
            totalRecipients > 0
              ? Math.round((totalReads / totalRecipients) * 100)
              : 0,
        };
      });

      return {
        success: true,
        data,
      };
    },
  );

  app.post(
    "/",
    {
      preHandler: [
        authGuard,
        requireRole(
          "SUPER_ADMIN",
          "GOVERNMENT_ADMIN",
          "HAULING_ADMIN",
        ),
      ],
    },
    async (req, reply) => {
      const body = req.body as {
        type?: string;
        audience?: string;
        title?: string;
        message?: string;
      };

      const type = body.type?.trim();
      const audience = body.audience?.trim();
      const title = body.title?.trim();
      const message = body.message?.trim();

      if (!type || !audience || !title || !message) {
        return reply.code(400).send({
          success: false,
          error: "Type, audience, title, and message are required.",
        });
      }

      const roles = AUDIENCE_ROLES[audience];

      if (!roles) {
        return reply.code(400).send({
          success: false,
          error: "Invalid notification audience.",
        });
      }

      const recipients = await prisma.user.findMany({
        where: {
          role: {
            in: roles as never[],
          },
        },
        select: {
          id: true,
        },
      });

      const notification = await prisma.$transaction(async (tx) => {
        const created = await tx.notification.create({
          data: {
            type,
            audience,
            title,
            message,
            createdById: req.user.sub,
          },
        });

        if (recipients.length > 0) {
          await tx.notificationReceipt.createMany({
            data: recipients.map((recipient) => ({
              notificationId: created.id,
              userId: recipient.id,
            })),
            skipDuplicates: true,
          });
        }

        return created;
      });

      return reply.code(201).send({
        success: true,
        data: {
          id: notification.id,
          type: notification.type,
          audience: notification.audience,
          title: notification.title,
          message: notification.message,
          createdAt: notification.createdAt,
          totalRecipients: recipients.length,
        },
      });
    },
  );

  app.get(
    "/me",
    {
      preHandler: authGuard,
    },
    async (req) => {
      const receipts = await prisma.notificationReceipt.findMany({
        where: {
          userId: req.user.sub,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          notification: true,
        },
      });

      return {
        success: true,
        data: receipts.map((receipt) => ({
          receiptId: receipt.id,
          notificationId: receipt.notificationId,
          type: receipt.notification.type,
          audience: receipt.notification.audience,
          title: receipt.notification.title,
          message: receipt.notification.message,
          createdAt: receipt.notification.createdAt,
          readAt: receipt.readAt,
        })),
      };
    },
  );

  app.patch(
    "/me/:receiptId/read",
    {
      preHandler: authGuard,
    },
    async (req, reply) => {
      const { receiptId } = req.params as {
        receiptId: string;
      };

      const receipt = await prisma.notificationReceipt.findFirst({
        where: {
          id: receiptId,
          userId: req.user.sub,
        },
      });

      if (!receipt) {
        return reply.code(404).send({
          success: false,
          error: "Notification was not found.",
        });
      }

      const updated = await prisma.notificationReceipt.update({
        where: {
          id: receipt.id,
        },
        data: {
          readAt: receipt.readAt ?? new Date(),
        },
      });

      return {
        success: true,
        data: updated,
      };
    },
  );
};
