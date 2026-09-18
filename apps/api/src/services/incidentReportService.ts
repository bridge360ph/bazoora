import { prisma } from "@bazoora/db";
import type { CreateIncidentReportInput } from "@bazoora/shared";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "./s3Client.js";
import { config } from "../plugins/config.js";
import { getNextSequence } from "../lib/counter.js";
import { generateIncidentReportNumber } from "../lib/displayId.js";
import { mapIncidentReport } from "../lib/incidentReportMapper.js";
import crypto from "node:crypto";

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
        imageUrl: data.imageUrl ?? null,
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
 */
export async function generateUploadPresignedUrl(
  fileName: string,
  fileType: string,
) {
  const bucket = config.awsS3Bucket;
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET IS NOT CONFIGURED");
  }

  const extension = fileName.split(".").pop() ?? "jpg";
  const uniqueId = crypto.randomUUID();
  const key = `incidents/${uniqueId}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: fileType,
  });

// URL VALID FOR 15 MINUTES (900 SECONDS)
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
  const uploadUrl = await getSignedUrl(s3Client as any, command, { expiresIn: 900 });
  const fileUrl = `https://${bucket}.s3.${config.awsRegion ?? "ap-southeast-1"}.amazonaws.com/${key}`;

  return {
    uploadUrl,
    fileUrl,
    key,
  };
}