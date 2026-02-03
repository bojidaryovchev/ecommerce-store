import { deleteS3Object, extractKeyFromUrl } from "@/lib/s3";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * DELETE /api/upload/delete
 * Delete an uploaded file by its public URL or key
 * This marks the upload as deleted in the DB and removes it from S3
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { publicUrl, key: providedKey } = body;

    if (!publicUrl && !providedKey) {
      return NextResponse.json({ error: "publicUrl or key is required" }, { status: 400 });
    }

    // Extract key from URL if not provided directly
    const key = providedKey ?? extractKeyFromUrl(publicUrl);
    if (!key) {
      return NextResponse.json({ error: "Invalid publicUrl format" }, { status: 400 });
    }

    // Find the upload record
    const [upload] = await db.select().from(schema.uploads).where(eq(schema.uploads.key, key)).limit(1);

    if (!upload) {
      // Upload not tracked in DB - still try to delete from S3
      console.warn(`Upload not found in DB for key: ${key}, attempting S3 delete anyway`);
    }

    // Delete from S3
    try {
      await deleteS3Object(key);
    } catch (s3Error) {
      console.error("Failed to delete from S3:", s3Error);
      // Continue to update DB even if S3 delete fails
    }

    // Update DB record if it exists
    if (upload) {
      await db
        .update(schema.uploads)
        .set({
          status: "deleted",
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.uploads.id, upload.id));
    }

    return NextResponse.json({ success: true, key });
  } catch (error) {
    console.error("Error deleting upload:", error);
    return NextResponse.json({ error: "Failed to delete upload" }, { status: 500 });
  }
}
