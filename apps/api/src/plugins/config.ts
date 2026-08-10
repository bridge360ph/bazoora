const authSecret = process.env.AUTH_SECRET?.trim();

if (!authSecret) {
  throw new Error(
    "AUTH_SECRET is required. Add it to the API environment file before starting the server.",
  );
}

const refreshTokenDays = Number(
  process.env.AUTH_REFRESH_TOKEN_DAYS ?? 7,
);

if (!Number.isInteger(refreshTokenDays) || refreshTokenDays <= 0) {
  throw new Error("AUTH_REFRESH_TOKEN_DAYS must be a positive integer.");
}

export const config = {
  port: Number(process.env.PORT ?? 3000),

  corsOrigin:
    process.env.CORS_ORIGIN?.split(",")
      .map((origin) => origin.replace(/['"]/g, "").trim())
      .filter(Boolean) ?? [],

  authSecret,
  accessTokenExpiresIn:
    process.env.AUTH_ACCESS_TOKEN_EXPIRES_IN?.trim() || "15m",
  refreshTokenDays,

  awsRegion: process.env.AWS_REGION,
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsS3Bucket: process.env.AWS_S3_BUCKET,
};
