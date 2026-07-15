/* eslint-disable */
import type { FastifyPluginAsync } from "fastify";
import { prisma } from "@bazoora/db";
import crypto from "node:crypto";
import { verifyAccessToken } from "../lib/jwt.js";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function comparePassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  // POST /auth/register
  app.post("/register", async (req, reply) => {
    const { email, password, role } = req.body as {
      email: string;
      password?: string;
      role: string;
    };

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      reply.status(400);
      return { success: false, message: "Email already registered" };
    }

    const hashedPassword = password
      ? hashPassword(password)
      : hashPassword("password123");
      
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role.toUpperCase() as any,
      },
    });

    return { success: true, data: user };
  });

  // POST /auth/login
  app.post("/login", async (req, reply) => {
    const { email, password } = req.body as {
      email: string;
      password?: string;
    };

    const cleanEmail = email.toLowerCase().trim();

    // Self-seeding logic for testing accounts
    const mockAccounts = [
      { email: "resident@bazoora.com", role: "RESIDENT" },
      { email: "driver@bazoora.com", role: "DRIVER" },
      { email: "eco@bazoora.com", role: "ECO_AIDE" },
      { email: "admin@bazoora.com", role: "HAULING_ADMIN" },
    ];

    const matchMock = mockAccounts.find((m) => m.email === cleanEmail);

    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user && matchMock) {
      // Auto-create test user if they try to log in
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          password: password ? hashPassword(password) : hashPassword("password123"),
          role: matchMock.role as any,
        },
      });
    }

    if (!user) {
      reply.status(401);
      return { success: false, message: "Invalid email or password" };
    }

    if (user.password && password) {
      const isMatch = comparePassword(password, user.password);
      if (!isMatch) {
        reply.status(401);
        return { success: false, message: "Invalid email or password" };
      }
    }

    // Generate access token (encode user metadata in base64 string)
    const tokenPayload = {
      sub: user.id,
      role: user.role.toLowerCase(),
      organizationId: "org-1",
    };
    const token = Buffer.from(JSON.stringify(tokenPayload)).toString("base64");

    return {
      success: true,
      data: {
        accessToken: "mock-" + token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.email.split("@")[0] || "User",
          lastName: "",
          role: user.role.toLowerCase(),
          organizationId: "org-1",
        },
      },
    };
  });

  // GET /auth/me
  app.get("/me", async (req, reply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      reply.status(401);
      return { success: false, message: "Unauthorized" };
    }

    const token = authHeader.split(" ")[1]!;
    try {
      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        reply.status(401);
        return { success: false, message: "User not found" };
      }

      return {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.email.split("@")[0] || "User",
          lastName: "",
          role: user.role.toLowerCase(),
          organizationId: "org-1",
        },
      };
    } catch {
      reply.status(401);
      return { success: false, message: "Invalid or expired session" };
    }
  });
};
