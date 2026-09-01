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
  const isProduction = process.env.NODE_ENV === "production";

  // The web app and API run on separate onrender.com subdomains, which are
  // cross-site (onrender.com is a public suffix). A Lax cookie would not be
  // sent on the cross-site fetch POSTs to /auth/refresh and /auth/logout, so
  // in production we need SameSite=None (which requires Secure). Lax is kept
  // for local dev where both run same-site on localhost.
  const sameSite: "none" | "lax" = isProduction ? "none" : "lax";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    path: "/auth",
    maxAge: config.refreshTokenDays * 24 * 60 * 60,
  };
}
