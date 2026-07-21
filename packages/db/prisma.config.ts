import "dotenv/config";
import { defineConfig } from "prisma/config";

// Read DATABASE_URL from the environment.
// Fall back to a placeholder only if it's completely missing.
const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

// DEBUG: Print the URL Prisma is actually using.
// Remove this after troubleshooting.
console.log("========================================");
console.log("Prisma Config Loaded");
console.log("DATABASE_URL =", DATABASE_URL);
console.log("========================================");

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: DATABASE_URL,
  },
});