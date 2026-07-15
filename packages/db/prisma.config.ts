import "dotenv/config";
import { defineConfig } from "prisma/config";

// `prisma generate` (CI, fresh installs, postinstall) doesn't open a connection,
// so it must not require DATABASE_URL. We fall back to a harmless placeholder when
// it's unset; commands that actually connect (migrate/studio) are always run with
// a real DATABASE_URL from `.env`.
const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: DATABASE_URL,
  },
});