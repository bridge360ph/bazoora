import { prisma } from "@bazoora/db";
import type { Prisma } from "@prisma/client";
import type { FastifyPluginCallback } from "fastify";

type EcoAideStatusInput =
  | "ACTIVE"
  | "SUSPENDED"
  | "DEACTIVATED";

type EcoAideAvailabilityInput =
  | "AVAILABLE"
  | "ON_ROUTE"
  | "OFF_DUTY";

interface CreateEcoAideProfileBody {
  userId?: string;
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
      id: true,
      name: true,
      email: true,
      role: true,
      assignedRoute: {
        select: {
          id: true,
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

function formatEcoAideProfile(
  profile: EcoAideProfileWithUser,
) {
  return {
    id: profile.id,
    userId: profile.userId,
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
  app.get("/", async () => {
    const profiles = await prisma.ecoAideProfile.findMany({
      where: {
        user: {
          is: {
            role: "ECO_AIDE",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
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

    const userId = body.userId?.trim();

    if (!userId) {
      return reply.code(400).send({
        success: false,
        message: "userId is required.",
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

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      return reply.code(404).send({
        success: false,
        message: "User not found.",
      });
    }

    if (user.role !== "ECO_AIDE") {
      return reply.code(400).send({
        success: false,
        message: "User must have the ECO_AIDE role.",
      });
    }

    const existingProfile =
      await prisma.ecoAideProfile.findUnique({
        where: {
          userId,
        },
        select: {
          id: true,
        },
      });

    if (existingProfile) {
      return reply.code(409).send({
        success: false,
        message:
          "An Eco-Aide profile already exists for this user.",
      });
    }

    const data: Prisma.EcoAideProfileUncheckedCreateInput = {
      userId,
    };

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

    const profile = await prisma.ecoAideProfile.create({
      data,
      include: ecoAideProfileInclude,
    });

    return reply.code(201).send({
      success: true,
      data: formatEcoAideProfile(profile),
    });
  });

  app.patch("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
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
          id,
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
        id,
      },
      data,
      include: ecoAideProfileInclude,
    });

    return {
      success: true,
      data: formatEcoAideProfile(profile),
    };
  });

  app.patch("/:id/suspend", async (request, reply) => {
    const { id } = request.params as { id: string };

    const existingProfile =
      await prisma.ecoAideProfile.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
        },
      });

    if (!existingProfile) {
      return reply.code(404).send({
        success: false,
        message: "Eco-Aide profile not found.",
      });
    }

    const profile = await prisma.ecoAideProfile.update({
      where: {
        id,
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
  });

  app.patch("/:id/deactivate", async (request, reply) => {
    const { id } = request.params as { id: string };

    const existingProfile =
      await prisma.ecoAideProfile.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
        },
      });

    if (!existingProfile) {
      return reply.code(404).send({
        success: false,
        message: "Eco-Aide profile not found.",
      });
    }

    const profile = await prisma.ecoAideProfile.update({
      where: {
        id,
      },
      data: {
        status: "DEACTIVATED",
      },
      include: ecoAideProfileInclude,
    });

    return {
      success: true,
      data: formatEcoAideProfile(profile),
    };
  });

  done();
};
