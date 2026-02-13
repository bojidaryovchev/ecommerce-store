import { auth } from "@/lib/auth";
import { generateUploadKey, getS3ObjectUrl, getUploadPresignedUrl, S3_BUCKET_NAME } from "@/lib/s3";
import { db, schema } from "@ecommerce/database";
import { UserRole } from "@ecommerce/database/schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Only admins can upload
    const session = await auth();
    const isAdmin = session?.user?.role === UserRole.ADMIN || session?.user?.role === UserRole.SUPER_ADMIN;
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate bucket is configured
    if (!S3_BUCKET_NAME) {
      return NextResponse.json({ error: "S3 bucket not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { filename, contentType, folder = "uploads" } = body;

    if (!filename || !contentType) {
      return NextResponse.json({ error: "filename and contentType are required" }, { status: 400 });
    }

    // Validate content type (only allow images)
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json({ error: `Invalid content type. Allowed: ${allowedTypes.join(", ")}` }, { status: 400 });
    }

    // Generate unique key
    const key = generateUploadKey(folder, filename);
    const publicUrl = getS3ObjectUrl(key);

    // Get presigned URL
    const uploadUrl = await getUploadPresignedUrl(key, contentType);

    // Record the upload in the database as pending
    await db.insert(schema.uploads).values({
      key,
      publicUrl,
      filename,
      contentType,
      folder,
      status: "pending",
    });

    // Return the presigned URL and the final public URL
    return NextResponse.json({
      uploadUrl,
      key,
      publicUrl,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
