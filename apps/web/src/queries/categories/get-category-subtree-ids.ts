import { db, schema } from "@ecommerce/database";
import { sql } from "drizzle-orm";

/**
 * Ids of a category and all its (non-deleted) descendants, so a parent category's page
 * also lists products filed under its subcategories. Call from inside a cached query.
 */
async function getCategorySubtreeIds(categoryId: string): Promise<string[]> {
  const rows = await db.execute<{ id: string }>(sql`
    WITH RECURSIVE tree AS (
      SELECT id FROM ${schema.categories} WHERE id = ${categoryId}
      UNION
      SELECT child.id FROM ${schema.categories} child
      JOIN tree ON child.parent_id = tree.id
      WHERE child.deleted_at IS NULL
    )
    SELECT id FROM tree
  `);
  return [...rows].map((row) => row.id);
}

export { getCategorySubtreeIds };
