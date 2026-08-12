import { prisma } from "@bazoora/db";
import type { Prisma } from "@prisma/client";
import type { FastifyPluginCallback } from "fastify";
import { authGuard, requireRole } from "../lib/auth.js";
import { getPasswordValidationErrors, hashPassword } from "../lib/password.js";

type EcoAideStatusInput =
  | "ACTIVE"
  | "SUSPENDED"
  | "DEACTIVATED";

type EcoAideAvailabilityInput =
  | "AVAILABLE"
  | "ON_ROUTE"
  | "OFF_DUTY";

interface CreateEcoAideProfileBody {
  email?: string;
  name?: string;
  password?: string;
  phone?: string | null;
  status?: EcoAideStatusInput;
  availability?: EcoAideAvailabilityInput;
}

interface UpdateEcoAideProfileBody {
  phone?: string | null;
  status?: EcoAideStatusInput;
  availability?: EcoAideAvailabilityInput;
}

const validStatuses: EcoAideStatusInput[] = [
  "ACTIVE",
  "SUSPENDED",
  "DEACTIVATED",
];

const validAvailabilities: EcoAideAvailabilityInput[] = [
  "AVAILABLE",
  "ON_ROUTE",
  "OFF_DUTY",
];

const ecoAideProfileInclude = {
  user: {
    select: {
      name: true,
      email: true,
      role: true,
      assignedRoute: {
        select: {
          routeNumber: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.EcoAideProfileInclude;

type EcoAideProfileWithUser =
  Prisma.EcoAideProfileGetPayload<{
    include: typeof ecoAideProfileInclude;
  }>;

function isEcoAideStatus(
  value: unknown,
): value is EcoAideStatusInput {
  return (
    typeof value === "string" &&
    validStatuses.includes(value as EcoAideStatusInput)
  );
}

function isEcoAideAvailability(
  value: unknown,
): value is EcoAideAvailabilityInput {
  return (
    typeof value === "string" &&
    validAvailabilities.includes(
      value as EcoAideAvailabilityInput,
    )
  );
}

function normalizePhone(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined || value === null) {
    return value;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

function formatEcoAideId(sequenceNumber: number): string {
  return `EA-${sequenceNumber.toString().padStart(3, "0")}`;
}

function parseEcoAideId(value: string): number | null {
  const match = /^EA-(\d+)$/i.exec(value.trim());

  if (!match) {
    return null;
  }

  const sequenceNumber = Number(match[1]);

  if (
    !Number.isSafeInteger(sequenceNumber) ||
    sequenceNumber <= 0
  ) {
    return null;
  }

  return sequenceNumber;
}

function formatEcoAideProfile(
  profile: EcoAideProfileWithUser,
) {
  return {
    ecoAideId: formatEcoAideId(profile.sequenceNumber),
    name: profile.user.name ?? "Unnamed Eco-Aide",
    email: profile.user.email,
    phone: profile.phone,
    status: profile.status,
    availability: profile.availability,
    assignedRoute: profile.user.assignedRoute,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export const ecoAideRoutes: FastifyPluginCallback = (
  app,
  _options,
  done,
) => {
  app.addHook("preHandler", authGuard);
app.addHook(
  "preHandler",
  requireRole("SUPER_ADMIN", "GOVERNMENT_ADMIN", "HAULING_ADMIN"),
);

app.get("/", async () => {
    const profiles = await prisma.ecoAideProfile.findMany({
      where: {
        archivedAt: null,
        user: {
          is: {
            role: "ECO_AIDE",
          },
        },
      },
      orderBy: {
        sequenceNumber: "asc",
      },
      include: ecoAideProfileInclude,
    });

    return {
      success: true,
      data: profiles.map(formatEcoAideProfile),
    };
  });

  app.post("/", async (request, reply) => {
  const body =
    (request.body ?? {}) as CreateEcoAideProfileBody;

  const email = body.email?.trim().toLowerCase() ?? "";
  const name = body.name?.trim() ?? "";
  const password = body.password ?? "";

  if (!email || !name || !password) {
    return reply.code(400).send({
      success: false,
      message: "Name, email, and password are required.",
    });
  }

  const passwordErrors =
    getPasswordValidationErrors(password);

  if (passwordErrors.length > 0) {
    return reply.code(400).send({
      success: false,
      message: "Password does not meet the requirements.",
      passwordErrors,
    });
  }

  if (
    body.status !== undefined &&
    !isEcoAideStatus(body.status)
  ) {
    return reply.code(400).send({
      success: false,
      message: "Invalid Eco-Aide status.",
    });
  }

  if (
    body.availability !== undefined &&
    !isEcoAideAvailability(body.availability)
  ) {
    return reply.code(400).send({
      success: false,
      message: "Invalid Eco-Aide availability.",
    });
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    return reply.code(409).send({
      success: false,
      message: "An account with this email already exists.",
    });
  }

  const passwordHash = await hashPassword(password);
  const phone = normalizePhone(body.phone);

  const profile = await prisma.$transaction(
    async (transaction) => {
      const user = await transaction.user.create({
        data: {
          email,
          name,
          password: passwordHash,
          role: "ECO_AIDE",
        },
      });

      return transaction.ecoAideProfile.create({
        data: {
          userId: user.id,
          ...(phone !== undefined
            ? { phone }
            : {}),
          ...(body.status !== undefined
            ? { status: body.status }
            : {}),
          ...(body.availability !== undefined
            ? { availability: body.availability }
            : {}),
        },
        include: ecoAideProfileInclude,
      });
    },
  );

  return reply.code(201).send({
    success: true,
    data: formatEcoAideProfile(profile),
  });
});
app.patch("/:ecoAideId", async (request, reply) => {
    const { ecoAideId } = request.params as {
      ecoAideId: string;
    };

    const sequenceNumber = parseEcoAideId(ecoAideId);

    if (sequenceNumber === null) {
      return reply.code(400).send({
        success: false,
        message: "Invalid Eco-Aide ID.",
      });
    }

    const body =
      (request.body ?? {}) as UpdateEcoAideProfileBody;

    if (
      body.status !== undefined &&
      !isEcoAideStatus(body.status)
    ) {
      return reply.code(400).send({
        success: false,
        message: "Invalid Eco-Aide status.",
      });
    }

    if (
      body.availability !== undefined &&
      !isEcoAideAvailability(body.availability)
    ) {
      return reply.code(400).send({
        success: false,
        message: "Invalid Eco-Aide availability.",
      });
    }

    const existingProfile =
      await prisma.ecoAideProfile.findUnique({
        where: {
          sequenceNumber,
        },
        include: {
          user: {
            select: {
              role: true,
            },
          },
        },
      });

    if (!existingProfile) {
      return reply.code(404).send({
        success: false,
        message: "Eco-Aide profile not found.",
      });
    }

    if (existingProfile.archivedAt) {
      return reply.code(409).send({
        success: false,
        message: "Eco-Aide profile is archived.",
      });
    }

    if (existingProfile.user.role !== "ECO_AIDE") {
      return reply.code(400).send({
        success: false,
        message:
          "The linked user does not have the ECO_AIDE role.",
      });
    }

    const data: Prisma.EcoAideProfileUncheckedUpdateInput =
      {};

    const phone = normalizePhone(body.phone);

    if (phone !== undefined) {
      data.phone = phone;
    }

    if (body.status !== undefined) {
      data.status = body.status;
    }

    if (body.availability !== undefined) {
      data.availability = body.availability;
    }

    if (Object.keys(data).length === 0) {
      return reply.code(400).send({
        success: false,
        message: "No profile fields were provided.",
      });
    }

    const profile = await prisma.ecoAideProfile.update({
      where: {
        sequenceNumber,
      },
      data,
      include: ecoAideProfileInclude,
    });

    return {
      success: true,
      data: formatEcoAideProfile(profile),
    };
  });

  app.patch(
    "/:ecoAideId/suspend",
    async (request, reply) => {
      const { ecoAideId } = request.params as {
        ecoAideId: string;
      };

      const sequenceNumber = parseEcoAideId(ecoAideId);

      if (sequenceNumber === null) {
        return reply.code(400).send({
          success: false,
          message: "Invalid Eco-Aide ID.",
        });
      }

      const existingProfile =
        await prisma.ecoAideProfile.findUnique({
          where: {
            sequenceNumber,
          },
          select: {
            archivedAt: true,
          },
        });

      if (!existingProfile) {
        return reply.code(404).send({
          success: false,
          message: "Eco-Aide profile not found.",
        });
      }

      if (existingProfile.archivedAt) {
        return reply.code(409).send({
          success: false,
          message: "Eco-Aide profile is archived.",
        });
      }

      const profile = await prisma.ecoAideProfile.update({
        where: {
          sequenceNumber,
        },
        data: {
          status: "SUSPENDED",
        },
        include: ecoAideProfileInclude,
      });

      return {
        success: true,
        data: formatEcoAideProfile(profile),
      };
    },
  );

  app.patch(
    "/:ecoAideId/deactivate",
    async (request, reply) => {
      const { ecoAideId } = request.params as {
        ecoAideId: string;
      };

      const sequenceNumber = parseEcoAideId(ecoAideId);

      if (sequenceNumber === null) {
        return reply.code(400).send({
          success: false,
          message: "Invalid Eco-Aide ID.",
        });
      }

      const existingProfile =
        await prisma.ecoAideProfile.findUnique({
          where: {
            sequenceNumber,
          },
          select: {
            archivedAt: true,
          },
        });

      if (!existingProfile) {
        return reply.code(404).send({
          success: false,
          message: "Eco-Aide profile not found.",
        });
      }

      if (existingProfile.archivedAt) {
        return reply.code(409).send({
          success: false,
          message: "Eco-Aide profile is archived.",
        });
      }

      const profile = await prisma.ecoAideProfile.update({
        where: {
          sequenceNumber,
        },
        data: {
          status: "DEACTIVATED",
          availability: "OFF_DUTY",
        },
        include: ecoAideProfileInclude,
      });

      return {
        success: true,
        data: formatEcoAideProfile(profile),
      };
    },
  );

  app.patch(
    "/:ecoAideId/archive",
    async (request, reply) => {
      const { ecoAideId } = request.params as {
        ecoAideId: string;
      };

      const sequenceNumber = parseEcoAideId(ecoAideId);

      if (sequenceNumber === null) {
        return reply.code(400).send({
          success: false,
          message: "Invalid Eco-Aide ID.",
        });
      }

      const existingProfile =
        await prisma.ecoAideProfile.findUnique({
          where: {
            sequenceNumber,
          },
          select: {
            archivedAt: true,
          },
        });

      if (!existingProfile) {
        return reply.code(404).send({
          success: false,
          message: "Eco-Aide profile not found.",
        });
      }

      if (existingProfile.archivedAt) {
        return reply.code(409).send({
          success: false,
          message: "Eco-Aide profile is already archived.",
        });
      }

      await prisma.ecoAideProfile.update({
        where: {
          sequenceNumber,
        },
        data: {
          archivedAt: new Date(),
          status: "DEACTIVATED",
          availability: "OFF_DUTY",
        },
      });

      return {
        success: true,
        data: {
          ecoAideId: formatEcoAideId(sequenceNumber),
        },
        message: "Eco-Aide profile archived.",
      };
    },
  );

  done();
};
