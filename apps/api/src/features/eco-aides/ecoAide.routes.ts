import type { FastifyInstance } from "fastify";
import { prisma } from "../../prisma.js";

type EcoAideAvailabilityInput = "AVAILABLE" | "ON_ROUTE" | "OFF_DUTY";
type EcoAideStatusInput = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

interface CreateEcoAideBody {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  availability?: EcoAideAvailabilityInput;
}

interface UpdateEcoAideBody {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  availability?: EcoAideAvailabilityInput;
  status?: EcoAideStatusInput;
}

interface EcoAideParams {
  id: string;
}

export function ecoAideRoutes(app: FastifyInstance) {
  app.get("/eco-aides", async () => {
    const ecoAides = await prisma.ecoAide.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return ecoAides;
  });

  app.post<{ Body: CreateEcoAideBody }>("/eco-aides", async (request, reply) => {
    const { firstName, lastName, email, phone, availability } = request.body;

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      return reply.code(400).send({
        message: "First name, last name, and email are required.",
      });
    }

    const ecoAide = await prisma.ecoAide.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        availability: availability ?? "AVAILABLE",
      },
    });

    return reply.code(201).send(ecoAide);
  });

  app.patch<{ Params: EcoAideParams; Body: UpdateEcoAideBody }>(
    "/eco-aides/:id",
    async (request) => {
      const { id } = request.params;
      const { firstName, lastName, email, phone, availability, status } =
        request.body;

      const ecoAide = await prisma.ecoAide.update({
        where: { id },
        data: {
          ...(firstName !== undefined ? { firstName: firstName.trim() } : {}),
          ...(lastName !== undefined ? { lastName: lastName.trim() } : {}),
          ...(email !== undefined ? { email: email.trim().toLowerCase() } : {}),
          ...(phone !== undefined ? { phone: phone.trim() || null } : {}),
          ...(availability !== undefined ? { availability } : {}),
          ...(status !== undefined ? { status } : {}),
        },
      });

      return ecoAide;
    },
  );

  app.patch<{ Params: EcoAideParams }>(
    "/eco-aides/:id/suspend",
    async (request) => {
      const { id } = request.params;

      const ecoAide = await prisma.ecoAide.update({
        where: { id },
        data: {
          status: "SUSPENDED",
        },
      });

      return ecoAide;
    },
  );

  app.patch<{ Params: EcoAideParams }>(
    "/eco-aides/:id/deactivate",
    async (request) => {
      const { id } = request.params;

      const ecoAide = await prisma.ecoAide.update({
        where: { id },
        data: {
          status: "DEACTIVATED",
        },
      });

      return ecoAide;
    },
  );
}