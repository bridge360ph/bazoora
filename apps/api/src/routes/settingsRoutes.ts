import type { FastifyPluginAsync } from "fastify";
import { prisma } from "@bazoora/db";

import { authGuard } from "../lib/auth.js";

interface UpdateProfileBody {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  streetAddress?: string;
  barangay?: string;
  cityMunicipality?: string;
  province?: string;
  postalCode?: string;
}

interface UpdatePreferencesBody {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  dailySummary?: boolean;
  darkMode?: boolean;
  autoAssignRoutes?: boolean;
  realTimeTracking?: boolean;
  automaticReports?: boolean;
}

const profileDefaults = {
  emailNotifications: true,
  pushNotifications: true,
  dailySummary: false,
  darkMode: false,
  autoAssignRoutes: true,
  realTimeTracking: true,
  automaticReports: false,
};

function normalizeOptionalText(value: string | undefined) {
  const normalized = value?.trim().replace(/\s+/g, " ");
  return normalized || null;
}

export const settingsRoutes: FastifyPluginAsync = async (app) => {
  await Promise.resolve();
  app.get(
    "/me",
    {
      preHandler: authGuard,
    },
    async (request, reply) => {
      const user = await prisma.user.findUnique({
        where: {
          id: request.user.sub,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          settingsProfile: true,
        },
      });

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: "User account was not found.",
        });
      }

      const profile =
        user.settingsProfile ??
        (await prisma.userSettingsProfile.create({
          data: {
            userId: user.id,
          },
        }));

      return reply.send({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          profile,
        },
      });
    },
  );

  app.patch(
    "/profile",
    {
      preHandler: authGuard,
    },
    async (request, reply) => {
      const body = request.body as UpdateProfileBody;

      const firstName = normalizeOptionalText(body.firstName);
      const lastName = normalizeOptionalText(body.lastName);
      const email = body.email?.trim().toLowerCase();

      if (!firstName || !lastName) {
        return reply.code(400).send({
          success: false,
          error: "First name and last name are required.",
        });
      }

      if (!email) {
        return reply.code(400).send({
          success: false,
          error: "Email is required.",
        });
      }

      const duplicateEmail = await prisma.user.findFirst({
        where: {
          email,
          id: {
            not: request.user.sub,
          },
        },
        select: {
          id: true,
        },
      });

      if (duplicateEmail) {
        return reply.code(409).send({
          success: false,
          error: "That email address is already in use.",
        });
      }

      const result = await prisma.$transaction(async (transaction) => {
        const user = await transaction.user.update({
          where: {
            id: request.user.sub,
          },
          data: {
            email,
            name: `${firstName} ${lastName}`,
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        });

        const profile = await transaction.userSettingsProfile.upsert({
          where: {
            userId: request.user.sub,
          },
          create: {
            userId: request.user.sub,
            firstName,
            lastName,
            phoneNumber: normalizeOptionalText(body.phoneNumber),
            streetAddress: normalizeOptionalText(body.streetAddress),
            barangay: normalizeOptionalText(body.barangay),
            cityMunicipality: normalizeOptionalText(body.cityMunicipality),
            province: normalizeOptionalText(body.province),
            postalCode: normalizeOptionalText(body.postalCode),
          },
          update: {
            firstName,
            lastName,
            phoneNumber: normalizeOptionalText(body.phoneNumber),
            streetAddress: normalizeOptionalText(body.streetAddress),
            barangay: normalizeOptionalText(body.barangay),
            cityMunicipality: normalizeOptionalText(body.cityMunicipality),
            province: normalizeOptionalText(body.province),
            postalCode: normalizeOptionalText(body.postalCode),
          },
        });

        return {
          user,
          profile,
        };
      });

      return reply.send({
        success: true,
        data: result,
        message: "Profile information saved.",
      });
    },
  );

  app.patch(
    "/preferences",
    {
      preHandler: authGuard,
    },
    async (request, reply) => {
      const body = request.body as UpdatePreferencesBody;

      const preferenceData = {
        emailNotifications:
          body.emailNotifications ?? profileDefaults.emailNotifications,
        pushNotifications:
          body.pushNotifications ?? profileDefaults.pushNotifications,
        dailySummary: body.dailySummary ?? profileDefaults.dailySummary,
        darkMode: body.darkMode ?? profileDefaults.darkMode,
        autoAssignRoutes:
          body.autoAssignRoutes ?? profileDefaults.autoAssignRoutes,
        realTimeTracking:
          body.realTimeTracking ?? profileDefaults.realTimeTracking,
        automaticReports:
          body.automaticReports ?? profileDefaults.automaticReports,
      };

      const profile = await prisma.userSettingsProfile.upsert({
        where: {
          userId: request.user.sub,
        },
        create: {
          userId: request.user.sub,
          ...preferenceData,
        },
        update: preferenceData,
      });

      return reply.send({
        success: true,
        data: {
          profile,
        },
        message: "Preferences saved.",
      });
    },
  );
};