import type { Prisma } from "@bazoora/db";

type CounterEntity =
  | "hauling_request"
  | "truck"
  | "eco_aide"
  | "route";

export async function getNextSequence(
  tx: Prisma.TransactionClient,
  entity: CounterEntity
) {
  const counter = await tx.counter.upsert({
    where: { entity },
    update: {
      sequence: {
        increment: 1,
      },
    },
    create: {
      entity,
      sequence: 1,
    },
  });

  return counter.sequence;
}