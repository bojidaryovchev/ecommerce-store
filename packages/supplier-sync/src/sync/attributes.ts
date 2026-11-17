import { attributes, supplierAttributes } from "@ecommerce/database/schema";
import { eq } from "drizzle-orm";
import { attributeSlugFromKey, type NormalizedProduct } from "../normalize/product";
import type { DbExecutor } from "../types";
import { uniqueSlug, type SyncContext } from "./shared";

/** supplier attribute key → our attribute id, for attributes that are mapped. */
export async function loadAttributeIds(db: DbExecutor, supplierId: string): Promise<Map<string, string>> {
  const rows = await db
    .select({ key: supplierAttributes.key, attributeId: supplierAttributes.attributeId })
    .from(supplierAttributes)
    .where(eq(supplierAttributes.supplierId, supplierId));
  const ids = new Map<string, string>();
  for (const row of rows) if (row.attributeId) ids.set(row.key, row.attributeId);
  return ids;
}

/**
 * Makes sure every supplier attribute used by these products has a matching attribute of ours.
 * New ones are created on first sight; existing mappings (including ones an admin removed) are kept.
 */
export async function ensureAttributes(ctx: SyncContext, products: readonly NormalizedProduct[]): Promise<void> {
  const rows = await ctx.db
    .select({ key: supplierAttributes.key, attributeId: supplierAttributes.attributeId })
    .from(supplierAttributes)
    .where(eq(supplierAttributes.supplierId, ctx.supplier.id));
  const known = new Set(rows.map((row) => row.key));
  for (const row of rows) if (row.attributeId) ctx.attributeIds.set(row.key, row.attributeId);

  const missing = new Map<string, { name: string; unit: string | null }>();
  for (const product of products) {
    for (const attribute of product.attributes) {
      if (known.has(attribute.key) || missing.has(attribute.key)) continue;
      const unit = attribute.values.find((value) => value.unit !== null)?.unit ?? null;
      missing.set(attribute.key, { name: attribute.name, unit });
    }
  }
  if (missing.size === 0) return;

  const ours = await ctx.db
    .select({ id: attributes.id, slug: attributes.slug, name: attributes.name })
    .from(attributes);
  const takenSlugs = new Set(ours.map((r) => r.slug));
  const idByName = new Map(ours.map((r) => [nameKey(r.name), r.id]));

  // Global (taxonomy) attributes first, so a hand-typed attribute with the same name joins it.
  const ordered = [...missing].sort(([a], [b]) => Number(a.startsWith("local:")) - Number(b.startsWith("local:")));
  for (const [key, info] of ordered) {
    const sameName = idByName.get(nameKey(info.name));
    const attributeId = await ctx.db.transaction(async (tx) => {
      if (sameName) {
        await tx
          .insert(supplierAttributes)
          .values({ supplierId: ctx.supplier.id, key, name: info.name, attributeId: sameName });
        return sameName;
      }
      const [created] = await tx
        .insert(attributes)
        .values({ slug: uniqueSlug(attributeSlugFromKey(key), takenSlugs), name: info.name, unit: info.unit })
        .returning({ id: attributes.id });
      if (!created) throw new Error(`Could not create attribute for ${key}`);
      await tx
        .insert(supplierAttributes)
        .values({ supplierId: ctx.supplier.id, key, name: info.name, attributeId: created.id });
      return created.id;
    });
    ctx.attributeIds.set(key, attributeId);
    idByName.set(nameKey(info.name), attributeId);
  }
}

/** "Подходящ за (кв.)" and "подходящ  за (кв.)" are the same attribute. */
function nameKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}
