"use server";

import { extractKeyFromUrl } from "@/lib/s3";
import type { ActionResult } from "@/types/action-result.type";
import { db, schema } from "@ecommerce/database";
import { and, eq, inArray } from "drizzle-orm";

type Upload = typeof schema.uploads.$inferSelect;

/**
 * Link an upload to an entity (marks it as in use)
 */
export async function linkUpload(
  publicUrl: string,
  entityId: string,
  entityType: "category" | "product",
): Promise<ActionResult<Upload>> {
  try {
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

/**
 * Link multiple uploads to an entity (for products with multiple images)
 */
export async function linkUploads(
  publicUrls: string[],
  entityId: string,
  entityType: "category" | "product",
): Promise<ActionResult<{ linked: number }>> {
  try {
    const keys = publicUrls.map((url) => extractKeyFromUrl(url)).filter((key): key is string => key !== null);

    if (keys.length === 0) {
      return { success: true, data: { linked: 0 } };
    }

    await db
      .update(schema.uploads)
      .set({
        status: "linked",
        linkedEntityId: entityId,
        linkedEntityType: entityType,
        linkedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(inArray(schema.uploads.key, keys));

    return { success: true, data: { linked: keys.length } };
  } catch (error) {
    console.error("Error linking uploads:", error);
    return { success: false, error: "Failed to link uploads" };
  }
}

/**
 * Unlink uploads from an entity (when entity is deleted or images are removed)
 * This marks them as pending again so they can be cleaned up
 */
export async function unlinkUploads(entityId: string, entityType: "category" | "product"): Promise<ActionResult<void>> {
  try {
    await db
      .update(schema.uploads)
      .set({
        status: "pending",
        linkedEntityId: null,
        linkedEntityType: null,
        linkedAt: null,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.uploads.linkedEntityId, entityId), eq(schema.uploads.linkedEntityType, entityType)));

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error unlinking uploads:", error);
    return { success: false, error: "Failed to unlink uploads" };
  }
}
