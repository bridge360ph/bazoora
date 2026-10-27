import "dotenv/config";
import { prisma } from "@bazoora/db";
import {
  getPasswordValidationErrors,
  hashPassword,
} from "../lib/password.js";

// Fail-closed guard: prevent execution outside development
if (process.env.NODE_ENV !== "development") {
  throw new Error(
    "Seed script execution aborted: NODE_ENV must be explicitly set to 'development'.",
  );
}

const email = process.env.SEED_DRIVER_EMAIL?.trim().toLowerCase();
const name = process.env.SEED_DRIVER_NAME?.trim() || "Bazoora Test Driver";
const password = process.env.SEED_DRIVER_PASSWORD ?? "";

if (!email) {
  throw new Error("SEED_DRIVER_EMAIL is required.");
}

if (!password) {
  throw new Error("SEED_DRIVER_PASSWORD is required.");
}

const passwordErrors = getPasswordValidationErrors(password);

if (passwordErrors.length > 0) {
  throw new Error(
    `SEED_DRIVER_PASSWORD is invalid: ${passwordErrors.join(" ")}`,
  );
}

const passwordHash = await hashPassword(password);

const driver = await prisma.user.upsert({
  where: { email },
  update: {
    name,
    password: passwordHash,
    role: "DRIVER",
  },
  create: {
    email,
    name,
    password: passwordHash,
    role: "DRIVER",
  },
  select: {
    id: true,
    email: true,
    name: true,
    role: true,
  },
});

process.stdout.write("DRIVER seed completed.\n");
process.stdout.write(`Email: ${driver.email}\n`);
process.stdout.write(`Role: ${driver.role}\n`);

await prisma.$disconnect();
