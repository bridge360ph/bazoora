import type {
  HaulingRequest as PrismaHaulingRequest,
  Prisma,
} from "@bazoora/db";
import type {
  CollectionDay,
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
      wasteType: true,
      assignedEcoAide: {
        select: {
          name: true,
        },
      },
    },
  },
} satisfies Prisma.HaulingRequestInclude;

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