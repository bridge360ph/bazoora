import { createHash, randomBytes } from "node:crypto";

import { config } from "../plugins/config.js";

export const REFRESH_TOKEN_COOKIE_NAME = "bazoora_refresh_token";

export function generateRefreshToken(): string {
  return randomBytes(64).toString("hex");
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function getRefreshTokenExpiration(): Date {
  const expiresAt = new Date();

  expiresAt.setDate(
    expiresAt.getDate() + config.refreshTokenDays,
  );

  return expiresAt;
}

export function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/auth",
    maxAge: config.refreshTokenDays * 24 * 60 * 60,
  };
}
