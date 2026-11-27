import { prisma } from "@bazoora/db";
import { HaulingRequestStatus, Prisma } from "@prisma/client";
import type {
  AvailablePaidRouteTruck,
  CreateHaulingRequestInput,
  CreatePaidHaulingRouteInput,
  HaulingFeasibilityCheck,
  HaulingFeasibilityResult,
  HaulingRouteOption,
  HaulingRouteStop,
  HaulingWasteType,
} from "@bazoora/shared";
import {
  haulingRequestInclude,
  mapHaulingRequest,
} from "../lib/haulingRequestMapper.js";
import { canRouteCollectWaste } from "../lib/haulingRouteCompatibility.js";
import { createRoute, getRouteById } from "./routeManagementService.js";
import { generateRouteNumber } from "../lib/displayId.js";
import {
  getScheduledCollectionAt,
  toManilaDateKey,
} from "../lib/haulingSchedule.js";
import { generateHaulingRequestNumber } from "../lib/displayId.js";
import { getNextSequence } from "../lib/counter.js";
import {
  createPresignedImageUpload,
  resolveUploadedImageUrl,
} from "../lib/s3ImageUpload.js";
import {
  HAULING_NOTIFICATION_TYPES,
  createDirectNotification,
  emitNotificationCreated,
} from "../lib/userNotifications.js";

export const DENIAL_REASON_MIN_LENGTH = 5;
export const DENIAL_REASON_MAX_LENGTH = 500;

/** Thrown for a denial reason that is too short once trimmed, or too long. */
export class InvalidDenialReasonError extends Error {}

/**
 * Thrown when a route cannot be assigned to a hauling request. Carries the
 * HTTP status so the route handler can answer 404 or 409 instead of 500.
 */
export class HaulingRouteError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "HaulingRouteError";
    this.statusCode = statusCode;
  }
}

function formatRouteForMessage(
  route: {
    routeNumber: number;
    name: string;
    collectionDay: string;
    startTime: string;
    collectionDate?: Date | null;
  },
  preferredPickup: Date | null,
  routeAssignedAt: Date | null,
): string {
  const routeLabel = `${generateRouteNumber(route.routeNumber)} ${route.name}`;
  const scheduled = getScheduledCollectionAt(preferredPickup, route, routeAssignedAt);

  if (!scheduled) {
    return `${routeLabel} (${route.collectionDay})`;
  }

  const when = scheduled.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return `${routeLabel} on ${when}`;
}

/**
 * Loads a route and checks it can collect the request's waste type.
 * Collection is segregated, so a mismatched route is refused.
 */
async function getCompatibleRoute(
  routeId: string,
  requestWasteType: HaulingWasteType,
) {
  const route = await prisma.route.findUnique({
    where: {
      id: routeId,
    },
    select: {
      id: true,
      routeNumber: true,
      name: true,
      collectionDay: true,
      startTime: true,
      collectionDate: true,
      wasteType: true,
      routeType: true,
    },
  });

  if (!route) {
    throw new HaulingRouteError("The selected route could not be found.", 404);
  }

  // A Paid route is built for one request. It cannot take others.
  if (route.routeType === "Paid") {
    throw new HaulingRouteError(
      `${generateRouteNumber(route.routeNumber)} is a Paid route for a single request. Choose a weekly route.`,
      409,
    );
  }

  if (!canRouteCollectWaste(route.wasteType, requestWasteType)) {
    throw new HaulingRouteError(
      `${generateRouteNumber(route.routeNumber)} collects ${
        WASTE_TYPE_LABELS[route.wasteType]?.toLowerCase() ?? route.wasteType
      }, which does not match this request.`,
      409,
    );
  }

  return route;
}

const WASTE_TYPE_LABELS: Record<string, string> = {
  RESIDUAL: "Residual waste",
  NON_BIODEGRADABLE: "Non-biodegradable waste",
  HAZARDOUS: "Hazardous waste",
  BIODEGRADABLE: "Biodegradable waste",
};

function formatPickupDate(date: Date | null): string {
  if (!date) return "the requested date";
  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function describeRequest(request: {
  requestNumber: string;
  wasteType: string;
  pickupDate: Date | null;
}): string {
  const waste = WASTE_TYPE_LABELS[request.wasteType]?.toLowerCase() ?? "waste";
  return `${request.requestNumber} (${waste}, pickup ${formatPickupDate(request.pickupDate)})`;
}

/**
 * Get all hauling requests
 */
export async function getHaulingRequests(
  userId?: string,
) {
  const requests =
    await prisma.haulingRequest.findMany({
      where: {
        archived: false,
        ...(userId && { userId }),
      },
      orderBy: {
        createdAt: "desc",
      },
      include: haulingRequestInclude,
    });

  return requests.map(mapHaulingRequest);
}

/**
 * Create a new hauling request on behalf of the authenticated requester.
 */
export async function createHaulingRequest(
  data: CreateHaulingRequestInput,
  userId: string,
) {
  const request = await prisma.$transaction(async (tx) => {
    const sequence = await getNextSequence(
      tx,
      "hauling_request",
    );

    const requestNumber = generateHaulingRequestNumber(sequence);

    const created = await tx.haulingRequest.create({
      data: {
        requestNumber: requestNumber,

        userId,

        orgId: null,

        requestAddress: data.requestAddress,

        ...(data.pickupLocations?.length && {
          pickupLocations: data.pickupLocations.map((stop) => ({
            address: stop.address.trim(),
            lat: stop.lat,
            lng: stop.lng,
          })),
        }),

        keepStopOrder: data.keepStopOrder ?? false,

        senderType: data.senderType,

        wasteType: data.wasteType,

        pickupDate: new Date(data.pickupDate),

        // Only a URL we issued for this feature is stored; anything else
        // (another site, a javascript: URL) becomes null.
        imageUrl: resolveUploadedImageUrl(data.imageUrl, "hauling-requests"),

        note: data.note ?? null,

        status: HaulingRequestStatus.PENDING,
      },
    });

    const notification = await createDirectNotification(tx, {
      userId,
      createdById: userId,
      type: HAULING_NOTIFICATION_TYPES.pending,
      title: "Hauling request submitted",
      message: `${describeRequest(created)} is pending and waiting for approval.`,
    });

    return { created, notification };
  });

  emitNotificationCreated(request.notification);

  return mapHaulingRequest(request.created);
}

/**
 * Thrown when a request exists but is no longer pending.
 * Routes turn this into a 409 rather than a 500.
 */
export class HaulingRequestNotPendingError extends Error {}

/**
 * Moves a request out of PENDING inside the caller's transaction. The status
 * check is part of the write (updateMany with status: PENDING), so when two
 * admins act at the same moment only one write matches and the other gets a
 * count of 0, instead of both passing a separate read and both sending a
 * notification. Returns null when the request does not exist.
 */
async function decidePendingRequest(
  tx: Prisma.TransactionClient,
  id: string,
  data: Prisma.HaulingRequestUncheckedUpdateManyInput,
  action: "approved" | "denied",
) {
  const { count } = await tx.haulingRequest.updateMany({
    where: {
      requestId: id,
      status: HaulingRequestStatus.PENDING,
    },
    data,
  });

  const request = await tx.haulingRequest.findUnique({
    where: {
      requestId: id,
    },
    include: haulingRequestInclude,
  });

  if (!request) {
    return null;
  }

  if (count === 0) {
    throw new HaulingRequestNotPendingError(
      `Only pending requests can be ${action}`,
    );
  }

  return request;
}

/**
 * Approve a hauling request, recording which admin approved it. A route can
 * be assigned at the same time, or later with assignHaulingRequestRoute when
 * no suitable route exists yet.
 */
export async function approveHaulingRequest(
  id: string,
  approvedBy: string,
  routeId?: string | null,
) {
  let route: Awaited<ReturnType<typeof getCompatibleRoute>> | null = null;

  if (routeId) {
    const existing = await prisma.haulingRequest.findUnique({
      where: {
        requestId: id,
      },
      select: {
        wasteType: true,
      },
    });

    if (!existing) {
      return null;
    }

    route = await getCompatibleRoute(routeId, existing.wasteType);
  }

  const result = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const updated = await decidePendingRequest(
      tx,
      id,
      {
        status: HaulingRequestStatus.APPROVED,
        approvedBy,
        approvedAt: now,
        ...(route && { routeId: route.id, routeAssignedAt: now }),
      },
      "approved",
    );

    if (!updated) {
      return null;
    }

    const created = await createDirectNotification(tx, {
      userId: updated.userId,
      createdById: approvedBy,
      type: HAULING_NOTIFICATION_TYPES.approved,
      title: "Hauling request approved",
      message: route
        ? `${describeRequest(updated)} has been approved and will be collected by ${formatRouteForMessage(route, updated.pickupDate, updated.routeAssignedAt)}.`
        : `${describeRequest(updated)} has been approved. It now appears on your schedule.`,
    });

    return { request: updated, notification: created };
  });

  if (!result) {
    return null;
  }

  emitNotificationCreated(result.notification);

  return mapHaulingRequest(result.request);
}

/**
 * Deny a hauling request
 */
export async function denyHaulingRequest(
  id: string,
  denialReason: string,
  deniedBy: string,
) {
  // Trim before checking the length: the route schema counts raw characters,
  // so a reason of six spaces passes it and would store an empty reason.
  const trimmedReason = denialReason.trim();

  if (
    trimmedReason.length < DENIAL_REASON_MIN_LENGTH ||
    trimmedReason.length > DENIAL_REASON_MAX_LENGTH
  ) {
    throw new InvalidDenialReasonError(
      `Denial reason must be between ${DENIAL_REASON_MIN_LENGTH} and ${DENIAL_REASON_MAX_LENGTH} characters`,
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await decidePendingRequest(
      tx,
      id,
      {
        status: HaulingRequestStatus.DENIED,
        denialReason: trimmedReason,
      },
      "denied",
    );

    if (!updated) {
      return null;
    }

    const created = await createDirectNotification(tx, {
      userId: updated.userId,
      createdById: deniedBy,
      type: HAULING_NOTIFICATION_TYPES.denied,
      title: "Hauling request denied",
      message: `${describeRequest(updated)} was denied. Reason: ${trimmedReason}`,
    });

    return { request: updated, notification: created };
  });

  if (!result) {
    return null;
  }

  emitNotificationCreated(result.notification);

  return mapHaulingRequest(result.request);
}

/**
 * Presigned upload target for a hauling request photo.
 * Shares signing and validation rules with incident reports.
 */
export async function createHaulingRequestPhotoUpload(fileType: string) {
  return createPresignedImageUpload("hauling-requests", fileType);
}

/**
 * Assigns, changes or clears the route of an approved hauling request. Used
 * when no route was picked at approval time, or the plan changes. The
 * requester is notified whenever their collection schedule actually changes.
 */
export async function assignHaulingRequestRoute(
  id: string,
  routeId: string | null,
  assignedBy: string,
) {
  const request = await prisma.haulingRequest.findUnique({
    where: {
      requestId: id,
    },
    select: {
      status: true,
      wasteType: true,
      routeId: true,
    },
  });

  if (!request) {
    return null;
  }

  if (request.status !== HaulingRequestStatus.APPROVED) {
    throw new HaulingRouteError(
      "Only approved requests can be assigned to a route.",
      409,
    );
  }

  const route = routeId
    ? await getCompatibleRoute(routeId, request.wasteType)
    : null;
  const previousRouteId = request.routeId;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.haulingRequest.update({
      where: {
        requestId: id,
      },
      data: {
        routeId,
        // A new route starts a new schedule from today. The same route keeps
        // its date.
        ...(routeId !== previousRouteId && {
          routeAssignedAt: routeId ? new Date() : null,
        }),
      },
      include: haulingRequestInclude,
    });

    // Saving the same route again changes nothing for the requester.
    if (routeId === previousRouteId) {
      return { request: updated, notification: null };
    }

    const notification = route
      ? await createDirectNotification(tx, {
          userId: updated.userId,
          createdById: assignedBy,
          type: HAULING_NOTIFICATION_TYPES.scheduled,
          title: previousRouteId
            ? "Collection schedule updated"
            : "Hauling request scheduled",
          message: `${describeRequest(updated)} will be collected by ${formatRouteForMessage(route, updated.pickupDate, updated.routeAssignedAt)}.`,
        })
      : await createDirectNotification(tx, {
          userId: updated.userId,
          createdById: assignedBy,
          type: HAULING_NOTIFICATION_TYPES.scheduled,
          title: "Collection schedule removed",
          message: `${describeRequest(updated)} is no longer on a collection route. You will be notified once it is scheduled again.`,
        });

    return { request: updated, notification };
  });

  if (result.notification) {
    emitNotificationCreated(result.notification);
  }

  return mapHaulingRequest(result.request);
}

/**
 * Routes that can collect a request's waste type, for the admin route
 * dropdown. Returns null when the request does not exist.
 */
export async function getHaulingRouteOptions(
  id: string,
): Promise<HaulingRouteOption[] | null> {
  const request = await prisma.haulingRequest.findUnique({
    where: {
      requestId: id,
    },
    select: {
      wasteType: true,
    },
  });

  if (!request) {
    return null;
  }

  const routes = await prisma.route.findMany({
    orderBy: {
      routeNumber: "asc",
    },
    select: {
      id: true,
      routeNumber: true,
      name: true,
      barangay: true,
      collectionDay: true,
      wasteType: true,
      routeType: true,
      collectionDate: true,
      assignedEcoAide: {
        select: {
          name: true,
        },
      },
    },
  });

  return routes
    .filter((route) => canRouteCollectWaste(route.wasteType, request.wasteType))
    // A Paid route is built for one request, so only weekly routes are offered.
    .filter((route) => route.routeType !== "Paid")
    .map((route) => ({
      id: route.id,
      routeDisplayNumber: generateRouteNumber(route.routeNumber),
      name: route.name,
      barangay: route.barangay,
      collectionDay: route.collectionDay as HaulingRouteOption["collectionDay"],
      wasteType: route.wasteType as HaulingRouteOption["wasteType"],
      ecoAideName: route.assignedEcoAide?.name ?? null,
      routeType: route.routeType,
      collectionDate: route.collectionDate
        ? route.collectionDate.toISOString().slice(0, 10)
        : null,
    }));
}

/**
 * Approved hauling requests on the caller's route that are scheduled for
 * today's run (Philippine time). A driver reaches their route through the
 * truck assigned to it; an eco-aide is assigned to the route directly.
 * Returns an empty list when the caller has no route.
 */
export async function getMyRouteHaulingStops(
  userId: string,
  role: string,
  now: Date = new Date(),
): Promise<HaulingRouteStop[]> {
  const route = await prisma.route.findFirst({
    where:
      role === "ECO_AIDE"
        ? { assignedEcoAideId: userId }
        : { assignedTruck: { assignedDriverId: userId } },
    select: {
      id: true,
      collectionDay: true,
      startTime: true,
      collectionDate: true,
    },
  });

  if (!route) {
    return [];
  }

  const requests = await prisma.haulingRequest.findMany({
    where: {
      routeId: route.id,
      status: HaulingRequestStatus.APPROVED,
      archived: false,
    },
    orderBy: {
      pickupDate: "asc",
    },
  });

  const todayKey = toManilaDateKey(now);
  const stops: HaulingRouteStop[] = [];

  for (const request of requests) {
    const scheduled = getScheduledCollectionAt(request.pickupDate, route);

    if (!scheduled || toManilaDateKey(scheduled) !== todayKey) {
      continue;
    }

    stops.push({
      requestId: request.requestId,
      requestNumber: request.requestNumber,
      wasteType: request.wasteType,
      requestAddress: request.requestAddress,
      ...(request.note !== null && { note: request.note }),
      scheduledCollectionAt: scheduled.toISOString(),
    });
  }

  return stops;
}

/** Trucks that can take a Paid route: Active, with a driver, and on no route. */
async function findAvailablePaidRouteTrucks(): Promise<AvailablePaidRouteTruck[]> {
  const trucks = await prisma.truck.findMany({
    where: {
      status: "Active",
      assignedDriverId: { not: null },
      assignedRoute: { is: null },
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      truckNumber: true,
      plateNumber: true,
      assignedDriver: {
        select: {
          name: true,
        },
      },
    },
  });

  return trucks.map((truck) => ({
    id: truck.id,
    truckNumber: truck.truckNumber,
    plateNumber: truck.plateNumber,
    driverName: truck.assignedDriver?.name ?? null,
  }));
}

function formatDateKey(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString("en-PH", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Checks whether a hauling request can be collected on a Paid route: the
 * pickup date and a free truck with a driver. The driving
 * path check runs in the browser. Returns null when the request does not
 * exist.
 */
export async function getHaulingFeasibility(
  id: string,
  now: Date = new Date(),
): Promise<HaulingFeasibilityResult | null> {
  const request = await prisma.haulingRequest.findUnique({
    where: {
      requestId: id,
    },
  });

  if (!request) {
    return null;
  }

  const checks: HaulingFeasibilityCheck[] = [];
  const todayKey = toManilaDateKey(now);
  const collectionDate = request.pickupDate
    ? toManilaDateKey(request.pickupDate)
    : null;

  // Pickup date. A missing or past date is a warning, not a failure: the
  // admin picks the collection date when creating the route, so a request
  // reviewed late can still be approved.
  if (!collectionDate) {
    checks.push({
      key: "date",
      label: "Pickup date",
      status: "warn",
      message: "The request has no preferred pickup date. Choose a collection date when creating the route.",
    });
  } else if (collectionDate < todayKey) {
    checks.push({
      key: "date",
      label: "Pickup date",
      status: "warn",
      message: `The preferred pickup date (${formatDateKey(collectionDate)}) has passed. Choose a later collection date when creating the route.`,
    });
  } else {
    const otherRequests = await prisma.haulingRequest.findMany({
      where: {
        userId: request.userId,
        requestId: { not: request.requestId },
        status: HaulingRequestStatus.APPROVED,
        archived: false,
        routeId: { not: null },
      },
      include: haulingRequestInclude,
    });

    const sameDay = otherRequests.filter((other) => {
      if (!other.route) return false;
      const scheduled = getScheduledCollectionAt(other.pickupDate, other.route);
      return scheduled !== null && toManilaDateKey(scheduled) === collectionDate;
    });

    checks.push(
      sameDay.length > 0
        ? {
            key: "date",
            label: "Pickup date",
            status: "warn",
            message: `${formatDateKey(collectionDate)}. This requester already has ${sameDay
              .map((other) => other.requestNumber)
              .join(", ")} collected that day.`,
          }
        : {
            key: "date",
            label: "Pickup date",
            status: "pass",
            message: `${formatDateKey(collectionDate)}. No other collection for this requester that day.`,
          },
    );
  }

  // Truck and driver
  const availableTrucks = await findAvailablePaidRouteTrucks();

  checks.push(
    availableTrucks.length > 0
      ? {
          key: "truck",
          label: "Truck and driver",
          status: "pass",
          message: `${availableTrucks.length} ${
            availableTrucks.length === 1 ? "truck is" : "trucks are"
          } free with a driver.`,
        }
      : {
          key: "truck",
          label: "Truck and driver",
          status: "fail",
          message:
            "No truck is free. Every Active truck with a driver is already on a route.",
        },
  );

  return {
    requestId: request.requestId,
    collectionDate,
    checks,
    availableTrucks,
  };
}

/**
 * Creates a one-time Paid route for a single hauling request, in one
 * transaction: the route is created, the truck is put on it, and the request
 * is linked to it (and approved, if it was still pending). Either all of it
 * happens or nothing changes. The requester is notified.
 */
export async function createPaidRouteForRequest(
  input: CreatePaidHaulingRouteInput,
  createdBy: string,
  now: Date = new Date(),
) {
  const request = await prisma.haulingRequest.findUnique({
    where: {
      requestId: input.requestId,
    },
  });

  if (!request) {
    throw new HaulingRouteError("The hauling request could not be found.", 404);
  }

  const wasPending = request.status === HaulingRequestStatus.PENDING;

  if (
    request.archived ||
    (!wasPending && request.status !== HaulingRequestStatus.APPROVED)
  ) {
    throw new HaulingRouteError(
      `${request.requestNumber} is not pending or approved.`,
      409,
    );
  }

  if (request.routeId) {
    throw new HaulingRouteError(
      `${request.requestNumber} is already on a route.`,
      409,
    );
  }

  if (input.collectionDate < toManilaDateKey(now)) {
    throw new HaulingRouteError("The collection date cannot be in the past.", 400);
  }

  const truck = await prisma.truck.findUnique({
    where: {
      id: input.truckId,
    },
    select: {
      id: true,
      status: true,
      assignedDriverId: true,
      assignedRoute: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!truck) {
    throw new HaulingRouteError("The selected truck could not be found.", 404);
  }

  if (truck.status !== "Active" || !truck.assignedDriverId) {
    throw new HaulingRouteError(
      "The selected truck must be Active and have a driver.",
      409,
    );
  }

  if (truck.assignedRoute) {
    throw new HaulingRouteError(
      `The selected truck is already on ${truck.assignedRoute.name}.`,
      409,
    );
  }

  // Filled inside the transaction, sent once it has committed.
  const notifications: Awaited<ReturnType<typeof createDirectNotification>>[] = [];
  let route;

  try {
    route = await createRoute(
      {
        name: input.name.trim(),
        barangay: input.barangay.trim(),
        // Replaced from stopLocations by createRoute.
        waypoints: "",
        wasteType: request.wasteType,
        // Replaced by the collection date's weekday for Paid routes.
        collectionDay: "Monday",
        startTime: input.startTime,
        routeType: "Paid",
        collectionDate: input.collectionDate,
        stopLocations: input.stopLocations,
      },
      async (tx, created) => {
        await tx.route.update({
          where: {
            id: created.id,
          },
          data: {
            assignedTruckId: truck.id,
          },
        });

        const { count } = await tx.haulingRequest.updateMany({
          where: {
            requestId: request.requestId,
            routeId: null,
            archived: false,
            status: request.status,
          },
          data: {
            routeId: created.id,
            routeAssignedAt: new Date(),
            ...(wasPending && {
              status: HaulingRequestStatus.APPROVED,
              approvedBy: createdBy,
              approvedAt: new Date(),
            }),
          },
        });

        // Another admin changed the request in the meantime.
        if (count !== 1) {
          throw new HaulingRouteError(
            "The request changed while the route was being created. Refresh and try again.",
            409,
          );
        }

        // A Paid route runs on its own date, so the time it was assigned does
        // not change when it is collected.
        const when = formatRouteForMessage(created, request.pickupDate, null);

        const notification = await createDirectNotification(tx, {
          userId: request.userId,
          createdById: createdBy,
          type: wasPending
            ? HAULING_NOTIFICATION_TYPES.approved
            : HAULING_NOTIFICATION_TYPES.scheduled,
          title: wasPending
            ? "Hauling request approved"
            : "Hauling request scheduled",
          message: wasPending
            ? `${describeRequest(request)} has been approved and will be collected by ${when}.`
            : `${describeRequest(request)} will be collected by ${when}.`,
        });

        notifications.push(notification);
      },
    );
  } catch (error) {
    if (error instanceof HaulingRouteError) {
      throw error;
    }

    // The truck was put on another route at the same moment.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new HaulingRouteError(
        "The selected truck was just assigned to another route.",
        409,
      );
    }

    // createRoute reports invalid fields (a short name, a bad date) as plain
    // Errors. Anything else, such as a database failure, is rethrown as is.
    if (error instanceof Error && error.constructor === Error) {
      throw new HaulingRouteError(error.message, 400);
    }

    throw error;
  }

  if (!route) {
    throw new HaulingRouteError(
      "A route with this name and barangay already exists.",
      409,
    );
  }

  for (const notification of notifications) {
    emitNotificationCreated(notification);
  }

  // Read it back so the response includes the truck put on it above.
  return (await getRouteById(route.id)) ?? route;
}
