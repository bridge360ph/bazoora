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
    } else if (token.includes("admin")) {
      role = "super_admin";
    }
    return {
      sub: `usr-mock-${role}-1`,
      role,
      organizationId: "org-1",
    };
  }

  // Fallback mock decoding for compatibility
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1] || "", "base64").toString()) as Record<string, unknown>;
      const rawSub = payload.sub || payload.id || "usr-mock-1";
      const rawRole = payload.role || "resident";
      const rawOrgId = payload.organizationId || payload.orgId || "org-1";
      return {
        sub: typeof rawSub === "string" ? rawSub : "usr-mock-1",
        role: typeof rawRole === "string" ? rawRole : "resident",
        organizationId: typeof rawOrgId === "string" ? rawOrgId : "org-1",
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
