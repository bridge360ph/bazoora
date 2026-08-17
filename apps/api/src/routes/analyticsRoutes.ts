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
      ]);

      return {
        success: true,
        data: {
          totals: {
            ecoAides: totalEcoAides,
            trucks: totalTrucks,
            assignedTrucks,
          },
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
