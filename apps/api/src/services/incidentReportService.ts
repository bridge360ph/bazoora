import { prisma } from "@bazoora/db";
import type { CreateIncidentReportInput } from "@bazoora/shared";
import { getNextSequence } from "../lib/counter.js";
import { generateIncidentReportNumber } from "../lib/displayId.js";
import { mapIncidentReport } from "../lib/incidentReportMapper.js";
import {
  createPresignedImageUpload,
  resolveUploadedImageUrl,
  UnsupportedUploadTypeError,
} from "../lib/s3ImageUpload.js";

export { UnsupportedUploadTypeError };

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
