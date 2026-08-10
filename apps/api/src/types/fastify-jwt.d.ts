import type { UserRole } from "@bazoora/db";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      sub: string;
      role: UserRole;
      authVersion: number;
    };
    user: {
      sub: string;
      role: UserRole;
      authVersion: number;
    };
  }
}

export {};
