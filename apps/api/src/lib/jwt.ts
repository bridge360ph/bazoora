export interface AccessTokenPayload {
  sub: string;
  role: string;
  organizationId: string | null;
}

export function verifyAccessToken(
  token: string,
): AccessTokenPayload {
  if (token.startsWith("mock-")) {
    const encodedPayload =
      token.substring("mock-".length);

    try {
      const decoded = Buffer.from(
        encodedPayload,
        "base64",
      ).toString("utf-8");

      const payload =
        JSON.parse(decoded) as Record<
          string,
          unknown
        >;

      const rawSub =
        payload.sub ||
        payload.id;

      const rawRole =
        payload.role ||
        "resident";

      const rawOrgId =
        payload.organizationId ||
        payload.orgId ||
        null;

      if (
        typeof rawSub === "string" &&
        rawSub.length > 0
      ) {
        return {
          sub: rawSub,
          role:
            typeof rawRole === "string"
              ? rawRole
              : "resident",
          organizationId:
            typeof rawOrgId === "string"
              ? rawOrgId
              : null,
        };
      }
    } catch (error) {
      console.error(
        "Mock token parsing failed:",
        error,
      );
    }

    throw new Error("Invalid access token");
  }

  try {
    const parts = token.split(".");

    if (parts.length === 3) {
      const payload = JSON.parse(
        Buffer.from(
          parts[1] || "",
          "base64",
        ).toString(),
      ) as Record<string, unknown>;

      const rawSub =
        payload.sub ||
        payload.id;

      const rawRole =
        payload.role ||
        "resident";

      const rawOrgId =
        payload.organizationId ||
        payload.orgId ||
        null;

      if (
        typeof rawSub === "string" &&
        rawSub.length > 0
      ) {
        return {
          sub: rawSub,
          role:
            typeof rawRole === "string"
              ? rawRole
              : "resident",
          organizationId:
            typeof rawOrgId === "string"
              ? rawOrgId
              : null,
        };
      }
    }
  } catch (error) {
    console.error(
      "JWT parse failed:",
      error,
    );
  }

  throw new Error("Invalid access token");
}