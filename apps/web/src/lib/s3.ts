import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
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

/**
 * Delete an object from S3
 */
export async function deleteS3Object(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Delete multiple objects from S3
 */
export async function deleteS3Objects(keys: string[]) {
  const results = await Promise.allSettled(keys.map((key) => deleteS3Object(key)));

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.error(`Failed to delete ${failed.length} objects from S3`);
  }

  return {
    total: keys.length,
    deleted: results.filter((r) => r.status === "fulfilled").length,
    failed: failed.length,
  };
}

/**
 * List all objects in a folder
 */
export async function listS3Objects(prefix: string, maxKeys = 1000) {
  const command = new ListObjectsV2Command({
    Bucket: S3_BUCKET_NAME,
    Prefix: prefix,
    MaxKeys: maxKeys,
  });

  const response = await s3Client.send(command);
  return response.Contents ?? [];
}

/**
 * Extract the S3 key from a public URL
 */
export function extractKeyFromUrl(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    // URL format: https://bucket.s3.region.amazonaws.com/key
    // The path starts with "/" so we remove it
    return url.pathname.slice(1);
  } catch {
    return null;
  }
}
