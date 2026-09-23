import "dotenv/config";
import { prisma } from "@bazoora/db";
import {
  getPasswordValidationErrors,
  hashPassword,
} from "../lib/password.js";

const email = process.env.SEED_RESIDENT_EMAIL?.trim().toLowerCase();
const name =
  process.env.SEED_RESIDENT_NAME?.trim() || "Bazoora Test Resident";
const password = process.env.SEED_RESIDENT_PASSWORD ?? "";

if (!email) {
  throw new Error("SEED_RESIDENT_EMAIL is required.");
}

if (!password) {
  throw new Error("SEED_RESIDENT_PASSWORD is required.");
}

const passwordErrors = getPasswordValidationErrors(password);

if (passwordErrors.length > 0) {
  throw new Error(
    `SEED_RESIDENT_PASSWORD is invalid: ${passwordErrors.join(" ")}`,
  );
}

const passwordHash = await hashPassword(password);

const resident = await prisma.user.upsert({
  where: { email },
  update: {
    name,
    password: passwordHash,
    role: "RESIDENT",
  },
  create: {
    email,
    name,
    password: passwordHash,
    role: "RESIDENT",
  },
  select: {
    id: true,
    email: true,
    name: true,
    role: true,
  },
});

process.stdout.write("RESIDENT seed completed.\n");
process.stdout.write(`Email: ${resident.email}\n`);
process.stdout.write(`Role: ${resident.role}\n`);

await prisma.$disconnect();