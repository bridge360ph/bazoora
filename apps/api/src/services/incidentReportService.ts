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
 * Accepts an attachment URL only when it points at the incidents prefix of our
 * own bucket. The client sends this back after uploading, so without the check
 * a report could cite any URL on the internet as its photo evidence.
 */
function resolveImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl || typeof imageUrl !== "string") {
    return null;
  }

  const bucket = config.awsS3Bucket;

  if (!bucket) {
    return null;
  }

  // A startsWith check on the prefix still admits
  // .../incidents/../some-other-key, so compare the parsed origin and require
  // the path to be exactly a key this endpoint could have issued. new URL()
  // normalises traversal before the pattern is applied.
  const expectedOrigin = `https://${bucket}.s3.${config.awsRegion ?? "ap-southeast-1"}.amazonaws.com`;

  let parsed: URL;

  try {
    parsed = new URL(imageUrl);
  } catch {
    return null;
  }

  if (parsed.origin !== expectedOrigin) {
    return null;
  }

  const isIssuedKey = /^\/incidents\/[0-9a-f-]{36}\.(jpg|png|webp|heic)$/.test(
    parsed.pathname,
  );

  return isIssuedKey ? parsed.toString() : null;
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
        imageUrl: resolveImageUrl(data.imageUrl),
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
// A Map, not an object literal: an object lookup with a caller-supplied key
// resolves inherited members, so a fileType of "constructor" or "toString"
// returns a truthy value and walks straight past the guard below.
const ALLOWED_IMAGE_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/heic", "heic"],
]);

/**
 * Thrown when the caller asks for an upload target we will not sign.
 * The route turns this into a 400 rather than a 500.
 */
export class UnsupportedUploadTypeError extends Error {}

export async function generateUploadPresignedUrl(fileType: string) {
  const bucket = config.awsS3Bucket;
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET IS NOT CONFIGURED");
  }

  // The extension and the content type both came from the client. Deriving the
  // extension from fileName let a caller ask for incidents/<uuid>.html served
  // as text/html from the bucket domain, which is a stored script on our own
  // origin rather than the photo evidence this endpoint advertises. Take the
  // extension from the content type we allow, and refuse anything else.
  const extension =
    typeof fileType === "string"
      ? ALLOWED_IMAGE_TYPES.get(fileType)
      : undefined;

  if (!extension) {
    throw new UnsupportedUploadTypeError(
      `Unsupported upload type: ${String(fileType)}`,
    );
  }

  // Matching the map exactly means fileType is already one of our canonical
  // strings. Rebind it so what we sign is provably the allowlisted value and
  // not whatever the caller sent.
  const contentType = ALLOWED_IMAGE_TYPES.has(fileType) ? fileType : "";

  const uniqueId = crypto.randomUUID();
  const key = `incidents/${uniqueId}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
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
