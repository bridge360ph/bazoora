import type { AuthUser, UserRole } from "@/stores/auth-store";

/**
 * The `user` object returned by the API. `role` is an UPPERCASE enum value and
 * `name` is a single string (or null) that we split into first/last names.
 */
export interface ApiUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

/**
 * Map the backend UserRole enum (UPPERCASE) to the store's lowercase union.
 * Unknown roles fall back to `resident` so an unexpected value never crashes
 * routing.
 */
export function mapApiRole(apiRole: string): UserRole {
  switch (apiRole) {
    case "SUPER_ADMIN": {
      return "super_admin";
    }
    case "GOVERNMENT_ADMIN": {
      return "government_agency";
    }
    case "HAULING_ADMIN": {
      return "hauling_org";
    }
    case "DRIVER": {
      return "driver";
    }
    case "ECO_AIDE": {
      return "eco_aide";
    }
    case "BUSINESS": {
      return "business";
    }
    case "RESIDENT": {
      return "resident";
    }
    default: {
      return "resident";
    }
  }
}

/**
 * The landing route for a given role.
 */
export function roleHome(role: UserRole): string {
  switch (role) {
    case "driver": {
      return "/driver";
    }
    case "eco_aide": {
      return "/eco-aide";
    }
    case "super_admin":
    case "government_agency":
    case "hauling_org":
    case "lgu":
    case "business_org": {
      return "/admin";
    }
    case "resident":
    case "business":
    case "citizen": {
      return "/resident";
    }
    default: {
      return "/resident";
    }
  }
}

/**
 * Convert an API user into the store's AuthUser shape.
 *
 * `name` is split on the first space into firstName/lastName. When `name` is
 * null we fall back to the email local-part for firstName and an empty
 * lastName. `organizationId` is not provided by this endpoint, so it is null.
 */
export function mapApiUser(apiUser: ApiUser): AuthUser {
  const trimmedName = apiUser.name?.trim() ?? "";
  let firstName: string;
  let lastName: string;

  if (trimmedName === "") {
    firstName = apiUser.email.split("@")[0] ?? apiUser.email;
    lastName = "";
  } else {
    const firstSpace = trimmedName.indexOf(" ");
    if (firstSpace === -1) {
      firstName = trimmedName;
      lastName = "";
    } else {
      firstName = trimmedName.slice(0, firstSpace);
      lastName = trimmedName.slice(firstSpace + 1).trim();
    }
  }

  return {
    id: apiUser.id,
    email: apiUser.email,
    firstName,
    lastName,
    role: mapApiRole(apiUser.role),
    organizationId: null,
  };
}
