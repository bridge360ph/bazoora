import { prisma, type Prisma } from "@bazoora/db";
import type {
  CreateIncidentReportInput,
  IncidentReportFilters,
  IncidentStatus,
  UpdateIncidentReportInput,
} from "@bazoora/shared";
import { getNextSequence } from "../lib/counter.js";
import { generateIncidentReportNumber } from "../lib/displayId.js";
import { mapIncidentReport } from "../lib/incidentReportMapper.js";
import {
  createPresignedImageUpload,
  resolveUploadedImageUrl,
  UnsupportedUploadTypeError,
} from "../lib/s3ImageUpload.js";

export { UnsupportedUploadTypeError };

/** The report is RESOLVED or DENIED and its status can no longer change. */
export class IncidentReportClosedError extends Error {}

/** Another admin changed the report between our read and our write. */
export class IncidentReportConflictError extends Error {}

const CLOSED_STATUSES: readonly IncidentStatus[] = ["RESOLVED", "DENIED"];

function isClosed(status: IncidentStatus) {
  return CLOSED_STATUSES.includes(status);
}

const adminIncidentInclude = {
  reporter: {
    select: {
      name: true,
    },
  },
  route: {
    select: {
      name: true,
    },
  },
} satisfies Prisma.IncidentReportInclude;

/**
 * FETCH ALL INCIDENT REPORTS FOR THE ADMIN REVIEW QUEUE, NEWEST FIRST
 */
export async function getIncidentReports(filters: IncidentReportFilters = {}) {
  const category = filters.category?.trim();

  const reports = await prisma.incidentReport.findMany({
    where: {
      ...(filters.status && { status: filters.status }),
      ...(category && {
        category: {
          equals: category,
          mode: "insensitive",
        },
      }),
    },
    include: adminIncidentInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  return reports.map(mapIncidentReport);
}

/**
 * ADMIN REVIEW: CHANGE STATUS AND/OR ADMIN NOTES.
 * Returns null when the report does not exist.
 */
export async function updateIncidentReport(
  id: string,
  input: UpdateIncidentReportInput,
) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.incidentReport.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!current) return null;

    const data: Prisma.IncidentReportUpdateManyMutationInput = {};
    const nextStatus = input.status;

    if (nextStatus && nextStatus !== current.status) {
      if (isClosed(current.status)) {
        throw new IncidentReportClosedError(
          "This report is already closed and its status cannot change",
        );
      }

      data.status = nextStatus;
      data.resolvedAt = isClosed(nextStatus) ? new Date() : null;
    }

    if (input.adminNotes !== undefined) {
      data.adminNotes = input.adminNotes.trim() || null;
    }

    if (Object.keys(data).length > 0) {
      // Guard the write on the status we read, so two admins closing the
      // same report at once cannot both succeed.
      const { count } = await tx.incidentReport.updateMany({
        where: { id, status: current.status },
        data,
      });

      if (count === 0) {
        throw new IncidentReportConflictError(
          "This report was just updated by someone else. Refresh and try again.",
        );
      }
    }

    const updated = await tx.incidentReport.findUniqueOrThrow({
      where: { id },
      include: adminIncidentInclude,
    });

    return mapIncidentReport(updated);
  });
}

/**
 * FETCH INCIDENT REPORTS FILED BY A SPECIFIC USER
 */
export async function getIncidentReportsByUser(userId: string) {
  const reports = await prisma.incidentReport.findMany({
    where: {
      reporterId: userId,
    },
    include: {
      reporter: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return reports.map(mapIncidentReport);
}

/**
 * CREATE A NEW INCIDENT REPORT WITH SEQUENTIAL DISPLAY ID
 */
export async function createIncidentReport(
  data: CreateIncidentReportInput,
  reporterId: string,
) {
  const report = await prisma.$transaction(async (tx) => {
    const sequence = await getNextSequence(tx, "incident_report");
    const reportNumber = generateIncidentReportNumber(sequence);

    return tx.incidentReport.create({
      data: {
        reportNumber,
        reporterId,
        category: data.category,
        description: data.description,
        routeId: data.routeId ?? null,
        stopName: data.stopName ?? null,
        imageUrl: resolveUploadedImageUrl(data.imageUrl, "incidents"),
      },
      include: {
        reporter: {
          select: {
            name: true,
          },
        },
      },
    });
  });

  return mapIncidentReport(report);
}

/**
 * GENERATE A PRESIGNED PUT URL FOR DIRECT S3 PHOTO UPLOADS
 * (shared with hauling requests, see lib/s3ImageUpload.ts)
 */
export async function generateUploadPresignedUrl(fileType: string) {
  return createPresignedImageUpload("incidents", fileType);
}
