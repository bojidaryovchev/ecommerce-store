"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { extractKeyFromUrl } from "@/lib/s3";
import type { ActionResult } from "@/types/action-result.type";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";

type Upload = typeof schema.uploads.$inferSelect;

/**
 * Link an upload to an entity (marks it as in use)
 */
async function linkUpload(
  publicUrl: string,
  entityId: string,
  entityType: "category" | "product",
): Promise<ActionResult<Upload>> {
  try {
    await requireAdmin();

    const key = extractKeyFromUrl(publicUrl);
    if (!key) {
      return { success: false, error: "Invalid upload URL" };
    }

    const [upload] = await db
      .update(schema.uploads)
      .set({
        status: "linked",
        linkedEntityId: entityId,
        linkedEntityType: entityType,
        linkedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.uploads.key, key))
      .returning();

    if (!upload) {
      // Upload not tracked - this is OK for legacy uploads
      console.warn(`Upload not found in DB for key: ${key}`);
      return { success: true, data: null as unknown as Upload };
    }

    return { success: true, data: upload };
  } catch (error) {
    console.error("Error linking upload:", error);
    return { success: false, error: "Failed to link upload" };
  }
}

export { linkUpload };
