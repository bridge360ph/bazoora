import * as argon2 from "argon2";

// LOAD THE ROOT ENVIRONMENT VARIABLES BEFORE IMPORTING THE CLIENT
process.loadEnvFile("../../.env");

async function main() {
  // DYNAMICALLY IMPORT THE CONFIGURED PRISMA INSTANCE
  const { prisma } = await import("../src/index.js");

  const hashedPassword = await argon2.hash("Password123!", {
    type: argon2.argon2id,
  });

  // UPSERT ECO-AIDE ACCOUNT AND ASSOCIATED PROFILE
  await prisma.user.upsert({
    where: { email: "ecoaide@bazoora.com" },
    update: { password: hashedPassword },
    create: {
      email: "ecoaide@bazoora.com",
      name: "Test Eco-Aide",
      password: hashedPassword,
      role: "ECO_AIDE",
      ecoAideProfile: {
        create: {
          phone: "09123456789",
          status: "ACTIVE",
          availability: "AVAILABLE",
        },
      },
    },
  });

  // ENSURE ADMIN PASSWORD HASH IS OVERWRITTEN IN LOCAL DB
  await prisma.user.upsert({
    where: { email: "admin@bazoora.com" },
    update: { password: hashedPassword },
    create: {
      email: "admin@bazoora.com",
      name: "System Admin",
      password: hashedPassword,
      role: "SUPER_ADMIN",
    },
  });

  console.log("Seed data injected successfully.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
