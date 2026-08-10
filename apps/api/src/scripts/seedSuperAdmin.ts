import "dotenv/config";

import { prisma } from "@bazoora/db";

import {
  getPasswordValidationErrors,
  hashPassword,
} from "../lib/password.js";

const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
const name = process.env.SEED_ADMIN_NAME?.trim() || "Bazoora Super Admin";
const password = process.env.SEED_ADMIN_PASSWORD ?? "";

if (!email) {
  throw new Error("SEED_ADMIN_EMAIL is required.");
}

if (!password) {
  throw new Error("SEED_ADMIN_PASSWORD is required.");
}

const passwordErrors = getPasswordValidationErrors(password);

if (passwordErrors.length > 0) {
  throw new Error(
    `SEED_ADMIN_PASSWORD is invalid: ${passwordErrors.join(" ")}`,
  );
}

const passwordHash = await hashPassword(password);

const admin = await prisma.user.upsert({
  where: { email },
  update: {
    name,
    password: passwordHash,
    role: "SUPER_ADMIN",
  },
  create: {
    email,
    name,
    password: passwordHash,
    role: "SUPER_ADMIN",
  },
  select: {
    id: true,
    email: true,
    name: true,
    role: true,
  },
});

process.stdout.write("SUPER_ADMIN seed completed.`n");
process.stdout.write(`Email: ${admin.email}` + "`n");
process.stdout.write(`Role: ${admin.role}` + "`n");

await prisma.$disconnect();
