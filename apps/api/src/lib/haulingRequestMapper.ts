import type {
  HaulingRequest as PrismaHaulingRequest,
  Prisma,
} from "@bazoora/db";
import type {
  CollectionDay,
  HaulingPickupLocation,
  HaulingRequest as SharedHaulingRequest,
  WasteType,
} from "@bazoora/shared";
import { generateRouteNumber } from "./displayId.js";
import { getScheduledCollectionAt } from "./haulingSchedule.js";

/** Loads the assigned route summary alongside a hauling request. */
export const haulingRequestInclude = {
  route: {
    select: {
      id: true,
      routeNumber: true,
      name: true,
      collectionDay: true,
      startTime: true,
      collectionDate: true,
      wasteType: true,
      assignedEcoAide: {
        select: {
          name: true,
        },
      },
    },
  },
} satisfies Prisma.HaulingRequestInclude;

/**
 * Reads the stored pickup stops, dropping anything malformed so a bad row
 * never breaks the whole list.
 */
export function readPickupLocations(value: unknown): HaulingPickupLocation[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item: unknown) => {
    if (typeof item !== "object" || item === null) return [];

    const { address, lat, lng } = item as Record<string, unknown>;

    if (typeof address !== "string") return [];

    const hasPosition =
      typeof lat === "number" &&
      typeof lng === "number" &&
      Number.isFinite(lat) &&
      Number.isFinite(lng);

    return [
      {
        address,
        lat: hasPosition ? lat : null,
        lng: hasPosition ? lng : null,
      },
    ];
  });
}

type HaulingRequestWithRoute = PrismaHaulingRequest & {
  route?: Prisma.HaulingRequestGetPayload<{
    include: typeof haulingRequestInclude;
  }>["route"];
};

export function mapHaulingRequest(
  request: HaulingRequestWithRoute,
): SharedHaulingRequest {
  return {
    requestId: request.requestId,
    
    requestNumber: request.requestNumber,
  
    userId: request.userId,

    requestAddress: request.requestAddress,

    keepStopOrder: request.keepStopOrder,

    ...(request.pickupLocations !== null && {
      pickupLocations: readPickupLocations(request.pickupLocations),
    }),

    senderType: request.senderType,

    wasteType: request.wasteType,

    pickupDate:
      request.pickupDate?.toISOString() ?? "",

    status: request.status,

    archived: request.archived,

    createdAt:
      request.createdAt.toISOString(),

    updatedAt:
      request.updatedAt.toISOString(),

    ...(request.orgId !== null && {
      orgId: request.orgId,
    }),

    ...(request.imageUrl !== null && {
      imageUrl: request.imageUrl,
    }),

    ...(request.approvedBy !== null && {
      approvedBy: request.approvedBy,
    }),

    ...(request.approvedAt !== null && {
      approvedAt: request.approvedAt.toISOString(),
    }),

    ...(request.denialReason !== null && {
      denialReason: request.denialReason,
    }),

    ...(request.note !== null && {
      note: request.note,
    }),

    ...(request.routeId !== null && {
      routeId: request.routeId,
    }),

    ...(request.route && {
      route: {
        id: request.route.id,
        routeDisplayNumber: generateRouteNumber(request.route.routeNumber),
        name: request.route.name,
        collectionDay: request.route.collectionDay as CollectionDay,
        startTime: request.route.startTime,
        wasteType: request.route.wasteType as WasteType,
        ecoAideName: request.route.assignedEcoAide?.name ?? null,
        scheduledCollectionAt:
          getScheduledCollectionAt(request.pickupDate, request.route)?.toISOString() ??
          null,
      },
    }),
  };
}