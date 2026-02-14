"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { extractKeyFromUrl } from "@/lib/s3";
import type { ActionResult } from "@/types/action-result.type";
import { db, schema } from "@ecommerce/database";
import { inArray } from "drizzle-orm";

/**
 * Link multiple uploads to an entity (for products with multiple images)
 */
async function linkUploads(
  publicUrls: string[],
  entityId: string,
  entityType: "category" | "product",
): Promise<ActionResult<{ linked: number }>> {
  try {
    await requireAdmin();

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

export { linkUploads };
