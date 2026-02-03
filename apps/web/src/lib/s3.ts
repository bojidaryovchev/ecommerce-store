import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { fromSSO } from "@aws-sdk/credential-provider-sso";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// AWS SDK credential resolution:
// - Production: AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY (auto-detected)
// - Local dev: AWS_PROFILE with SSO
const getS3Client = () => {
  const region = process.env.AWS_REGION ?? "eu-central-1";

  // Local dev with SSO profile
  if (process.env.AWS_PROFILE) {
    return new S3Client({
      region,
      credentials: fromSSO({ profile: process.env.AWS_PROFILE }),
    });
  }

  // Default: uses AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY automatically
  return new S3Client({ region });
};

export const s3Client = getS3Client();

export const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME ?? "";

/**
 * Generate a presigned URL for uploading a file to S3
 */
export async function getUploadPresignedUrl(key: string, contentType: string, expiresIn = 3600) {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
}

/**
 * Get the public URL for an S3 object
 */
export function getS3ObjectUrl(key: string) {
  return `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION ?? "eu-central-1"}.amazonaws.com/${key}`;
}

/**
 * Generate a unique key for uploading a file
 */
export function generateUploadKey(folder: string, filename: string) {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${folder}/${timestamp}-${randomSuffix}-${sanitizedFilename}`;
}
