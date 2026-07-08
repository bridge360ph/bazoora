import { Prisma } from "@prisma/client";
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

function isDuplicateEmailError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function isRecordNotFoundError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
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

    try {
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
    } catch (error: unknown) {
      if (isDuplicateEmailError(error)) {
        return reply.code(409).send({
          message: "An Eco-Aide with this email already exists.",
        });
      }

      throw error;
    }
  });

  app.patch<{ Params: EcoAideParams; Body: UpdateEcoAideBody }>(
    "/eco-aides/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { firstName, lastName, email, phone, availability, status } =
        request.body;

      try {
        const ecoAide = await prisma.ecoAide.update({
          where: { id },
          data: {
            ...(firstName !== undefined ? { firstName: firstName.trim() } : {}),
            ...(lastName !== undefined ? { lastName: lastName.trim() } : {}),
            ...(email !== undefined
              ? { email: email.trim().toLowerCase() }
              : {}),
            ...(phone !== undefined ? { phone: phone.trim() || null } : {}),
            ...(availability !== undefined ? { availability } : {}),
            ...(status !== undefined ? { status } : {}),
          },
        });

        return ecoAide;
      } catch (error: unknown) {
        if (isDuplicateEmailError(error)) {
          return reply.code(409).send({
            message: "An Eco-Aide with this email already exists.",
          });
        }

        if (isRecordNotFoundError(error)) {
          return reply.code(404).send({
            message: "Eco-Aide not found.",
          });
        }

        throw error;
      }
    },
  );

  app.patch<{ Params: EcoAideParams }>(
    "/eco-aides/:id/suspend",
    async (request, reply) => {
      const { id } = request.params;

      try {
        const ecoAide = await prisma.ecoAide.update({
          where: { id },
          data: {
            status: "SUSPENDED",
          },
        });

        return ecoAide;
      } catch (error: unknown) {
        if (isRecordNotFoundError(error)) {
          return reply.code(404).send({
            message: "Eco-Aide not found.",
          });
        }

        throw error;
      }
    },
  );

  app.patch<{ Params: EcoAideParams }>(
    "/eco-aides/:id/deactivate",
    async (request, reply) => {
      const { id } = request.params;

      try {
        const ecoAide = await prisma.ecoAide.update({
          where: { id },
          data: {
            status: "DEACTIVATED",
          },
        });

        return ecoAide;
      } catch (error: unknown) {
        if (isRecordNotFoundError(error)) {
          return reply.code(404).send({
            message: "Eco-Aide not found.",
          });
        }

        throw error;
      }
    },
  );
}