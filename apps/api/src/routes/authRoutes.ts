import { prisma } from "@bazoora/db";
import type { UserRole } from "@bazoora/db";
import type { FastifyPluginAsync } from "fastify";

import { authGuard } from "../lib/auth.js";
import {
  getPasswordValidationErrors,
  hashPassword,
  verifyPassword,
} from "../lib/password.js";
import {
  generateRefreshToken,
  getRefreshCookieOptions,
  getRefreshTokenExpiration,
  hashRefreshToken,
  REFRESH_TOKEN_COOKIE_NAME,
} from "../lib/refreshToken.js";

interface ChangePasswordBody {
  currentPassword?: string;
  newPassword?: string;
}

interface LoginBody {
  email?: string;
  password?: string;
}

interface RegisterBody {
  email?: string;
  name?: string;
  password?: string;
  role?: "RESIDENT" | "BUSINESS";
}

type StaffRole =
  | "GOVERNMENT_ADMIN"
  | "HAULING_ADMIN"
  | "DRIVER"
  | "ECO_AIDE";

interface RegisterStaffBody {
  email?: string;
  name?: string;
  password?: string;
  role?: StaffRole;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function publicUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  await Promise.resolve();
  app.post("/login", async (request, reply) => {
    const body = request.body as LoginBody;
    const email = body.email ? normalizeEmail(body.email) : "";
    const password = body.password ?? "";

    if (!email || !password) {
      return reply.code(400).send({
        success: false,
        error: "Email and password are required.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await verifyPassword(user.password, password))) {
      return reply.code(401).send({
        success: false,
        error: "Invalid email or password.",
      });
    }

    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const expiresAt = getRefreshTokenExpiration();

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const accessToken = app.jwt.sign({
      sub: user.id,
      role: user.role,
      authVersion: user.authVersion,
    });

    reply.setCookie(
      REFRESH_TOKEN_COOKIE_NAME,
      rawRefreshToken,
      getRefreshCookieOptions(),
    );

    return reply.send({
      success: true,
      data: {
        accessToken,
        user: publicUser(user),
      },
    });
  });

  app.post("/refresh", async (request, reply) => {
    const rawRefreshToken =
      request.cookies[REFRESH_TOKEN_COOKIE_NAME];

    if (!rawRefreshToken) {
      return reply.code(401).send({
        success: false,
        error: "Refresh token is missing.",
      });
    }

    const tokenHash = hashRefreshToken(rawRefreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt <= new Date()
    ) {
      reply.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
        path: "/auth",
      });

      return reply.code(401).send({
        success: false,
        error: "Refresh token is invalid or expired.",
      });
    }

    const nextRawRefreshToken = generateRefreshToken();
    const nextTokenHash = hashRefreshToken(nextRawRefreshToken);
    const nextExpiresAt = getRefreshTokenExpiration();
    const revokedAt = new Date();

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt },
      }),
      prisma.refreshToken.create({
        data: {
          userId: storedToken.userId,
          tokenHash: nextTokenHash,
          expiresAt: nextExpiresAt,
        },
      }),
    ]);

    const accessToken = app.jwt.sign({
      sub: storedToken.user.id,
      role: storedToken.user.role,
      authVersion: storedToken.user.authVersion,
    });

    reply.setCookie(
      REFRESH_TOKEN_COOKIE_NAME,
      nextRawRefreshToken,
      getRefreshCookieOptions(),
    );

    return reply.send({
      success: true,
      data: {
        accessToken,
        user: publicUser(storedToken.user),
      },
    });
  });

  app.post("/logout", async (request, reply) => {
    const rawRefreshToken =
      request.cookies[REFRESH_TOKEN_COOKIE_NAME];

    if (rawRefreshToken) {
      const tokenHash = hashRefreshToken(rawRefreshToken);

      await prisma.refreshToken.updateMany({
        where: {
          tokenHash,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }

    reply.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      path: "/auth",
    });

    return reply.send({
      success: true,
      message: "Logged out successfully.",
    });
  });

  app.get(
    "/me",
    {
      preHandler: authGuard,
    },
    async (request, reply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.user.sub },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: "User account was not found.",
        });
      }

      return reply.send({
        success: true,
        data: {
          user,
        },
      });
    },
  );

  app.post(
    "/change-password",
    {
      preHandler: authGuard,
    },
    async (request, reply) => {
      const body = request.body as ChangePasswordBody;
      const currentPassword = body.currentPassword ?? "";
      const newPassword = body.newPassword ?? "";

      if (!currentPassword || !newPassword) {
        return reply.code(400).send({
          success: false,
          error: "Current password and new password are required.",
        });
      }

      const user = await prisma.user.findUnique({
        where: {
          id: request.user.sub,
        },
        select: {
          id: true,
          password: true,
        },
      });

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: "User account was not found.",
        });
      }

      const currentPasswordIsValid = await verifyPassword(
        user.password,
        currentPassword,
      );

      if (!currentPasswordIsValid) {
        return reply.code(400).send({
          success: false,
          error: "Current password is incorrect.",
        });
      }

      const newPasswordMatchesCurrent = await verifyPassword(
        user.password,
        newPassword,
      );

      if (newPasswordMatchesCurrent) {
        return reply.code(400).send({
          success: false,
          error:
            "New password must be different from the current password.",
        });
      }

      const passwordErrors =
        getPasswordValidationErrors(newPassword);

      if (passwordErrors.length > 0) {
        return reply.code(400).send({
          success: false,
          error: "Password does not meet the requirements.",
          passwordErrors,
        });
      }

      const passwordHash = await hashPassword(newPassword);
      const revokedAt = new Date();

      await prisma.$transaction([
        prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            password: passwordHash,
            authVersion: {
              increment: 1,
            },
          },
        }),
        prisma.refreshToken.updateMany({
          where: {
            userId: user.id,
            revokedAt: null,
          },
          data: {
            revokedAt,
          },
        }),
      ]);

      reply.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
        path: "/auth",
      });

      return reply.send({
        success: true,
        message:
          "Password changed successfully. Please log in again.",
      });
    },
  );
  app.post(
    "/register-staff",
    {
      preHandler: authGuard,
    },
    async (request, reply) => {
      const body = request.body as RegisterStaffBody;
      const email = body.email
        ? normalizeEmail(body.email)
        : "";
      const name = body.name?.trim() || null;
      const password = body.password ?? "";
      const role = body.role;

      if (!email || !password || !role) {
        return reply.code(400).send({
          success: false,
          error: "Email, password, and role are required.",
        });
      }

      const rolesAllowedByCreator: Partial<
        Record<UserRole, StaffRole[]>
      > = {
        SUPER_ADMIN: [
          "GOVERNMENT_ADMIN",
          "HAULING_ADMIN",
        ],
        GOVERNMENT_ADMIN: [
          "DRIVER",
          "ECO_AIDE",
        ],
        HAULING_ADMIN: [
          "DRIVER",
          "ECO_AIDE",
        ],
      };

      const allowedRoles =
        rolesAllowedByCreator[request.user.role] ?? [];

      if (!allowedRoles.includes(role)) {
        return reply.code(403).send({
          success: false,
          error:
            "You do not have permission to create this account role.",
        });
      }

      const passwordErrors =
        getPasswordValidationErrors(password);

      if (passwordErrors.length > 0) {
        return reply.code(400).send({
          success: false,
          error: "Password does not meet the requirements.",
          passwordErrors,
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
          error: "An account with this email already exists.",
        });
      }

      const passwordHash = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: passwordHash,
          role,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      return reply.code(201).send({
        success: true,
        data: {
          user,
        },
      });
    },
  );
  app.post("/register", async (request, reply) => {
    const body = request.body as RegisterBody;
    const email = body.email ? normalizeEmail(body.email) : "";
    const name = body.name?.trim() || null;
    const password = body.password ?? "";
    const role = body.role ?? "RESIDENT";

    if (!email || !password) {
      return reply.code(400).send({
        success: false,
        error: "Email and password are required.",
      });
    }

    if (role !== "RESIDENT" && role !== "BUSINESS") {
      return reply.code(403).send({
        success: false,
        error:
          "Only resident and business accounts may self-register.",
      });
    }

    const passwordErrors =
      getPasswordValidationErrors(password);

    if (passwordErrors.length > 0) {
      return reply.code(400).send({
        success: false,
        error: "Password does not meet the requirements.",
        passwordErrors,
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return reply.code(409).send({
        success: false,
        error: "An account with this email already exists.",
      });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: passwordHash,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return reply.code(201).send({
      success: true,
      data: {
        user,
      },
    });
  });
};
