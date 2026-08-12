import { prisma } from "@bazoora/db";
import type { UserRole } from "@bazoora/db";
import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

export async function authGuard(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify();

    const user = await prisma.user.findUnique({
      where: {
        id: request.user.sub,
      },
      select: {
        authVersion: true,
      },
    });

    if (
      !user ||
      user.authVersion !== request.user.authVersion
    ) {
      await reply.code(401).send({
        success: false,
        error:
          "Your session is no longer valid. Please log in again.",
      });
    }
  } catch {
    await reply.code(401).send({
      success: false,
      error: "Authentication required.",
    });
  }
}

export function requireRole(
  ...allowedRoles: UserRole[]
): (
  request: FastifyRequest,
  reply: FastifyReply,
) => Promise<void> {
  return async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!allowedRoles.includes(request.user.role)) {
      await reply.code(403).send({
        success: false,
        error:
          "You do not have permission to perform this action.",
      });
    }
  };
}
