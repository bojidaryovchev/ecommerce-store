"use server";

import type { ActionResult } from "@/types/action-result.type";
import { db, schema } from "@ecommerce/database";
import { and, eq } from "drizzle-orm";

/**
 * Unlink uploads from an entity (when entity is deleted or images are removed)
 * This marks them as pending again so they can be cleaned up
 */
async function unlinkUploads(entityId: string, entityType: "category" | "product"): Promise<ActionResult<void>> {
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

export { unlinkUploads };
