import { prisma } from "@bazoora/db";
import type { FastifyPluginCallback } from "fastify";

type LegacyEcoAideStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

type LegacyEcoAideAvailability =
  | "AVAILABLE"
  | "ON_ROUTE"
  | "OFF_DUTY";

interface LegacyEcoAideRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: LegacyEcoAideStatus;
  availability: LegacyEcoAideAvailability;
  createdAt: Date;
  updatedAt: Date;
}

export const ecoAideRoutes: FastifyPluginCallback = (
  app,
  _options,
  done,
) => {
  app.get("/", async (_request, reply) => {
    try {
      const ecoAides = await prisma.$queryRaw<LegacyEcoAideRow[]>`
        SELECT
          "id",
          "firstName",
          "lastName",
          "email",
          "phone",
          "status",
          "availability",
          "createdAt",
          "updatedAt"
        FROM "EcoAide"
        ORDER BY "createdAt" DESC
      `;

      return {
        success: true,
        data: ecoAides.map((ecoAide) => ({
          id: ecoAide.id,
          firstName: ecoAide.firstName,
          lastName: ecoAide.lastName,
          name: `${ecoAide.firstName} ${ecoAide.lastName}`.trim(),
          email: ecoAide.email,
          phone: ecoAide.phone,
          status: ecoAide.status,
          availability: ecoAide.availability,
          createdAt: ecoAide.createdAt.toISOString(),
          updatedAt: ecoAide.updatedAt.toISOString(),
        })),
      };
    } catch (error: unknown) {
      app.log.error(error);

      return reply.code(500).send({
        success: false,
        message: "Unable to load Eco-Aides.",
      });
    }
  });

  done();
};
