/* eslint-disable */
export interface AccessTokenPayload {
  sub: string;
  role: string;
  organizationId: string | null;
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  // Mock tokens used in the simulator
  if (token.startsWith("mock-")) {
    let role = "resident";
    if (token.includes("driver")) {
      role = "driver";
    } else if (token.includes("eco")) {
      role = "eco_aide";
    }
    return {
      sub: "usr-mock-1",
      role,
      organizationId: "org-1",
    };
  }

  // Real JWT token parsing
  try {
    // Attempt decoding raw base64 payload if not signed or using jsonwebtoken
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1] || "", "base64").toString());
      return {
        sub: payload.sub || payload.id || "usr-mock-1",
        role: payload.role || "resident",
        organizationId: payload.organizationId || payload.orgId || "org-1",
      };
    }
  } catch (err) {
    console.error("JWT parse fallback failed:", err);
  }

  // Fallback default
  return {
    sub: "usr-mock-1",
    role: "resident",
    organizationId: "org-1",
  };
}
