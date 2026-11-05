import type { FastifyPluginAsync } from "fastify";
import { prisma } from "@bazoora/db";

import { authGuard } from "../lib/auth.js";

interface UpdateProfileBody {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  streetAddress?: string;
  region?: string;
  barangay?: string;
  cityMunicipality?: string;
  province?: string;
  postalCode?: string;
  latitude?: number | null;
  longitude?: number | null;
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

      // A saved address must be on the map, so it can be used as a pickup.
      const { latitude, longitude } = body;
      const hasLocation =
        typeof latitude === "number" &&
        typeof longitude === "number" &&
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180;
      const hasAddress =
        normalizeOptionalText(body.streetAddress) !== null ||
        normalizeOptionalText(body.barangay) !== null;

      if (hasAddress && !hasLocation) {
        return reply.code(400).send({
          success: false,
          error: "Locate your address on the map before saving.",
        });
      }

      const location = {
        latitude: hasAddress && hasLocation ? latitude : null,
        longitude: hasAddress && hasLocation ? longitude : null,
      };

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
            region: normalizeOptionalText(body.region),
            barangay: normalizeOptionalText(body.barangay),
            cityMunicipality: normalizeOptionalText(body.cityMunicipality),
            province: normalizeOptionalText(body.province),
            postalCode: normalizeOptionalText(body.postalCode),
            ...location,
          },
          update: {
            firstName,
            lastName,
            phoneNumber: normalizeOptionalText(body.phoneNumber),
            streetAddress: normalizeOptionalText(body.streetAddress),
            region: normalizeOptionalText(body.region),
            barangay: normalizeOptionalText(body.barangay),
            cityMunicipality: normalizeOptionalText(body.cityMunicipality),
            province: normalizeOptionalText(body.province),
            postalCode: normalizeOptionalText(body.postalCode),
            ...location,
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