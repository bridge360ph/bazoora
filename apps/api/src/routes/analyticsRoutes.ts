import type { FastifyPluginAsync } from "fastify";
import { prisma } from "@bazoora/db";
import { authGuard, requireRole } from "../lib/auth.js";

export const analyticsRoutes: FastifyPluginAsync = async (app) => {
  await Promise.resolve();
  app.get(
    "/overview",
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
      const [
        totalEcoAides,
        totalTrucks,
        assignedTrucks,
        activeTrucks,
        idleTrucks,
        maintenanceTrucks,
        activeEcoAides,
        suspendedEcoAides,
        deactivatedEcoAides,
        availableEcoAides,
        onRouteEcoAides,
        offDutyEcoAides,
      ] = await prisma.$transaction([
        prisma.user.count({
          where: {
            role: "ECO_AIDE",
          },
        }),
        prisma.truck.count(),
        prisma.truck.count({
          where: {
            assignedDriverId: {
              not: null,
            },
          },
        }),
        prisma.truck.count({
          where: {
            status: "Active",
          },
        }),
        prisma.truck.count({
          where: {
            status: "Idle",
          },
        }),
        prisma.truck.count({
          where: {
            status: "Under Maintenance",
          },
        }),

        prisma.ecoAideProfile.count({
          where: { status: "ACTIVE", archivedAt: null },
        }),

        prisma.ecoAideProfile.count({
          where: { status: "SUSPENDED", archivedAt: null },
        }),

        prisma.ecoAideProfile.count({
          where: { status: "DEACTIVATED", archivedAt: null },
        }),

        prisma.ecoAideProfile.count({
          where: { availability: "AVAILABLE", archivedAt: null },
        }),

        prisma.ecoAideProfile.count({
          where: { availability: "ON_ROUTE", archivedAt: null },
        }),

        prisma.ecoAideProfile.count({
          where: { availability: "OFF_DUTY", archivedAt: null },
        }),
      ]);

      return {
        success: true,
        data: {
          totals: {
            ecoAides: totalEcoAides,
            trucks: totalTrucks,
            assignedTrucks,
          },
          ecoAideStatus: [
            {
              name: "Active",
              value: activeEcoAides,
            },
            {
              name: "Suspended",
              value: suspendedEcoAides,
            },
            {
              name: "Deactivated",
              value: deactivatedEcoAides,
            },
          ],

          ecoAideAvailability: [
            {
              name: "Available",
              value: availableEcoAides,
            },
            {
              name: "On Route",
              value: onRouteEcoAides,
            },
            {
              name: "Off Duty",
              value: offDutyEcoAides,
            },
          ],

          truckStatus: [
            {
              name: "Active",
              value: activeTrucks,
            },
            {
              name: "Idle",
              value: idleTrucks,
            },
            {
              name: "Under Maintenance",
              value: maintenanceTrucks,
            },
          ],
        },
      };
    },
  );
};
