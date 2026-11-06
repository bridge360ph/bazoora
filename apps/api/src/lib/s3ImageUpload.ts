import crypto from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../services/s3Client.js";
import { config } from "../plugins/config.js";

/**
 * Shared S3 photo upload helpers. Incident reports and hauling requests both
 * let the client upload a photo straight to S3 and then send the resulting URL
 * back, so the signing rules and the URL check live in one place.
 */

/** Key prefixes we issue upload targets under, one per feature. */
export type ImageUploadPrefix = "incidents" | "hauling-requests";

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
 * Routes turn this into a 400 rather than a 500.
 */
export class UnsupportedUploadTypeError extends Error {}

function bucketOrigin(bucket: string): string {
  return `https://${bucket}.s3.${config.awsRegion || "ap-southeast-1"}.amazonaws.com`;
}

/**
 * Generates a presigned PUT URL for a photo under the given prefix.
 */
export async function createPresignedImageUpload(
  prefix: ImageUploadPrefix,
  fileType: string,
) {
  const bucket = config.awsS3Bucket;
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET IS NOT CONFIGURED");
  }

  // The extension and the content type both came from the client. Deriving the
  // extension from fileName let a caller ask for <prefix>/<uuid>.html served
  // as text/html from the bucket domain, which is a stored script on our own
  // origin rather than a photo. Take the extension from the content type we
  // allow, and refuse anything else.
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

  const key = `${prefix}/${crypto.randomUUID()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  // URL VALID FOR 15 MINUTES (900 SECONDS)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
  const uploadUrl = await getSignedUrl(s3Client as any, command, { expiresIn: 900 });

  return {
    uploadUrl,
    fileUrl: `${bucketOrigin(bucket)}/${key}`,
    key,
  };
}

/**
 * Accepts a photo URL only when it points at a key we could have issued under
 * the given prefix of our own bucket. The client sends this URL back after
 * uploading, so without the check a record could store any URL at all,
 * including a javascript: URL that is later rendered as a link to an admin.
 * Anything else becomes null.
 */
export function resolveUploadedImageUrl(
  imageUrl: string | null | undefined,
  prefix: ImageUploadPrefix,
): string | null {
  if (!imageUrl || typeof imageUrl !== "string") {
    return null;
  }

  const bucket = config.awsS3Bucket;

  if (!bucket) {
    return null;
  }

  let parsed: URL;

  try {
    parsed = new URL(imageUrl);
  } catch {
    return null;
  }

  // A startsWith check on the prefix still admits <prefix>/../some-other-key,
  // so compare the parsed origin and require the path to be exactly a key we
  // could have issued. new URL() normalises traversal before the pattern runs.
  if (parsed.origin !== bucketOrigin(bucket)) {
    return null;
  }

  const issuedKey = new RegExp(
    `^/${prefix}/[0-9a-f-]{36}\\.(jpg|png|webp|heic)$`,
  );

  return issuedKey.test(parsed.pathname) ? parsed.toString() : null;
}
