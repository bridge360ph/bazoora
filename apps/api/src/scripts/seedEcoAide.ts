import "dotenv/config";

import { prisma } from "@bazoora/db";
import {
  getPasswordValidationErrors,
  hashPassword,
} from "../lib/password.js";

// Fail-closed guard: prevent execution outside development
if (process.env.NODE_ENV !== "development") {
  throw new Error(
    "Seed script execution aborted: NODE_ENV must be explicitly set to 'development'."
  );
}

const email = (process.env.SEED_ECO_AIDE_EMAIL ?? "ecoaide@bazoora.com").trim().toLowerCase();
const name = process.env.SEED_ECO_AIDE_NAME?.trim() || "Test Eco-Aide";
const password = process.env.SEED_ECO_AIDE_PASSWORD ?? "";

if (!email) {
  throw new Error("SEED_ECO_AIDE_EMAIL is required.");
}

if (!password) {
  throw new Error("SEED_ECO_AIDE_PASSWORD is required.");
}

const passwordErrors = getPasswordValidationErrors(password);
if (passwordErrors.length > 0) {
  throw new Error(`SEED_ECO_AIDE_PASSWORD is invalid: ${passwordErrors.join(" ")}`);
}

function formatEcoAideId(sequenceNumber: number): string {
  return `EA-${sequenceNumber.toString().padStart(3, "0")}`;
}

const passwordHash = await hashPassword(password);

const ecoAide = await prisma.$transaction(async (tx) => {
  const existingUser = await tx.user.findUnique({
    where: { email },
    include: { ecoAideProfile: true },
  });

  if (existingUser) {
    let profile = existingUser.ecoAideProfile;
    if (!profile) {
      profile = await tx.ecoAideProfile.create({
        data: {
          userId: existingUser.id,
          phone: "09123456789",
          status: "ACTIVE",
          availability: "AVAILABLE",
        },
      });
    }

    if (!existingUser.userNumber && profile) {
      const formattedId = formatEcoAideId(profile.sequenceNumber);
      await tx.user.update({
        where: { id: existingUser.id },
        data: { userNumber: formattedId },
      });
    }

    return tx.user.findUniqueOrThrow({
      where: { email },
      select: { id: true, email: true, name: true, role: true, userNumber: true },
    });
  }

  const user = await tx.user.create({
    data: {
      email,
      name,
      password: passwordHash,
      role: "ECO_AIDE",
      ecoAideProfile: {
        create: {
          phone: "09123456789",
          status: "ACTIVE",
          availability: "AVAILABLE",
        },
      },
    },
    include: {
      ecoAideProfile: true,
    },
  });

  if (user.ecoAideProfile) {
    const formattedId = formatEcoAideId(user.ecoAideProfile.sequenceNumber);
    await tx.user.update({
      where: { id: user.id },
      data: { userNumber: formattedId },
    });
    user.userNumber = formattedId;
  }

  return user;
});

process.stdout.write("ECO_AIDE seed completed.\n");
process.stdout.write(`Email: ${ecoAide.email}\n`);
process.stdout.write(`Role: ${ecoAide.role}\n`);
process.stdout.write(`Eco-Aide ID: ${ecoAide.userNumber ?? "N/A"}\n`);

await prisma.$disconnect();
