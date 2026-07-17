export interface AccessTokenPayload {
  sub: string;
  role: string;
  organizationId: string | null;
}

// Real JWT verification (Fastify JWT) is not implemented yet — see #52.
// Until it is, this only accepts the dev/demo Role Simulator's `mock-` tokens,
// gated to non-production, and fails closed everywhere else. It must NEVER
// return a default identity (that was an auth bypass) — it throws on failure so
// callers reject the request.
export function verifyAccessToken(token: string): AccessTokenPayload {
  const mockAuthAllowed = process.env.NODE_ENV !== "production";

  if (mockAuthAllowed && token.startsWith("mock-")) {
    let role = "resident";
    if (token.includes("driver")) {
      role = "driver";
    } else if (token.includes("eco")) {
      role = "eco_aide";
    } else if (token.includes("admin")) {
      role = "super_admin";
    }
    return {
      sub: `usr-mock-${role}-1`,
      role,
      organizationId: "org-1",
    };
  }

  throw new Error("Invalid or unverifiable access token");
}
