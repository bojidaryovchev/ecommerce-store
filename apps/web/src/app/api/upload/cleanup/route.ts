import { deleteS3Objects } from "@/lib/s3";
import { db, schema } from "@ecommerce/database";
import { and, eq, lt, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// Secret token for Lambda authentication (set via environment variable)
const CLEANUP_SECRET = process.env.UPLOAD_CLEANUP_SECRET;

// How old (in hours) a pending upload must be before it's considered orphaned
const ORPHAN_THRESHOLD_HOURS = 24;

/**
 * POST /api/upload/cleanup
 * Cleanup orphaned uploads (pending uploads older than threshold)
 * Called by Lambda on a schedule
 */
export async function POST(request: NextRequest) {
  try {
    // Validate secret token
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!CLEANUP_SECRET || token !== CLEANUP_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse optional parameters from body
    const body = await request.json().catch(() => ({}));
    const thresholdHours = body.thresholdHours ?? ORPHAN_THRESHOLD_HOURS;
    const dryRun = body.dryRun ?? false;
    const batchSize = body.batchSize ?? 100;

    // Calculate cutoff time
    const cutoffTime = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);

    // Find orphaned uploads (pending and older than threshold)
    const orphanedUploads = await db
      .select()
      .from(schema.uploads)
      .where(and(eq(schema.uploads.status, "pending"), lt(schema.uploads.createdAt, cutoffTime)))
      .limit(batchSize);

    if (orphanedUploads.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No orphaned uploads found",
        stats: { found: 0, deleted: 0, failed: 0 },
      });
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        message: "Dry run - no deletions performed",
        dryRun: true,
        stats: {
          found: orphanedUploads.length,
          wouldDelete: orphanedUploads.map((u) => ({ id: u.id, key: u.key, createdAt: u.createdAt })),
        },
      });
    }

    // Delete from S3
    const keys = orphanedUploads.map((u) => u.key);
    const s3Result = await deleteS3Objects(keys);

    // Mark as deleted in database
    const uploadIds = orphanedUploads.map((u) => u.id);
    await db
      .update(schema.uploads)
      .set({
        status: "deleted",
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(sql`${schema.uploads.id} = ANY(${uploadIds})`);

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${s3Result.deleted} orphaned uploads`,
      stats: {
        found: orphanedUploads.length,
        deleted: s3Result.deleted,
        failed: s3Result.failed,
      },
    });
  } catch (error) {
    console.error("Error during cleanup:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}

/**
 * GET /api/upload/cleanup
 * Get stats about orphaned uploads without deleting them
 */
export async function GET(request: NextRequest) {
  try {
    // Validate secret token
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!CLEANUP_SECRET || token !== CLEANUP_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const thresholdHours = parseInt(url.searchParams.get("thresholdHours") ?? String(ORPHAN_THRESHOLD_HOURS));

    const cutoffTime = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);

    // Count orphaned uploads by status
    const [stats] = await db
      .select({
        pending: sql<number>`count(*) filter (where ${schema.uploads.status} = 'pending' and ${schema.uploads.createdAt} < ${cutoffTime})`,
        linked: sql<number>`count(*) filter (where ${schema.uploads.status} = 'linked')`,
        deleted: sql<number>`count(*) filter (where ${schema.uploads.status} = 'deleted')`,
        total: sql<number>`count(*)`,
      })
      .from(schema.uploads);

    return NextResponse.json({
      success: true,
      thresholdHours,
      cutoffTime: cutoffTime.toISOString(),
      stats: {
        orphanedPending: Number(stats?.pending ?? 0),
        linked: Number(stats?.linked ?? 0),
        deleted: Number(stats?.deleted ?? 0),
        total: Number(stats?.total ?? 0),
      },
    });
  } catch (error) {
    console.error("Error getting cleanup stats:", error);
    return NextResponse.json({ error: "Failed to get stats" }, { status: 500 });
  }
}
