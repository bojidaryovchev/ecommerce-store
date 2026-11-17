import { categories, supplierCategories } from "@ecommerce/database/schema";
import { eq } from "drizzle-orm";
import { cleanLabel, safeDecodeURIComponent } from "../normalize/text";
import { slugify } from "../normalize/transliterate";
import { wooCategorySchema, type WooCategory } from "../woocommerce/schemas";
import { uniqueSlug, type SyncContext } from "./shared";

const UNCATEGORIZED = new Set(["uncategorized", "без-категория", "без категория"]);

/** The supplier's marketing buckets ("ТОП ОФЕРТИ"): our promotions are our own, so these get no category of ours. */
const PROMOTIONAL = /^(топ оферти|оферти|промоции|промо|разпродажба|top offers|offers|sale)$/iu;

function getsNoCategory(category: { name: string; slug: string }): boolean {
  const name = category.name.toLowerCase();
  return UNCATEGORIZED.has(category.slug.toLowerCase()) || UNCATEGORIZED.has(name) || PROMOTIONAL.test(name);
}

/**
 * Mirrors the supplier's category list. A category seen for the first time gets a matching
 * category of ours (nested like theirs); after that the mapping is ours and is never
 * overwritten, so categories can be renamed, merged or remapped freely.
 */
export async function syncCategories(ctx: SyncContext, rawCategories: unknown[]): Promise<void> {
  const parsed: WooCategory[] = [];
  for (const raw of rawCategories) {
    const result = wooCategorySchema.safeParse(raw);
    if (result.success) parsed.push(result.data);
    else ctx.logger.warn("Skipping a category the supplier API returned in an unexpected shape");
  }

  const existingRows = await ctx.db
    .select()
    .from(supplierCategories)
    .where(eq(supplierCategories.supplierId, ctx.supplier.id));
  const existing = new Map(existingRows.map((row) => [row.externalId, row]));
  for (const row of existingRows) {
    ctx.categories.set(row.externalId, {
      externalId: row.externalId,
      parentExternalId: row.parentExternalId,
      name: row.name,
      categoryId: row.categoryId,
    });
  }

  // Parents before children, so a new child can be nested under its parent's new category.
  const byId = new Map(parsed.map((category) => [category.id, category]));
  const depth = (category: WooCategory) => {
    let d = 0;
    const seen = new Set<number>([category.id]);
    let parent = byId.get(category.parent);
    while (parent && !seen.has(parent.id)) {
      seen.add(parent.id);
      d += 1;
      parent = byId.get(parent.parent);
    }
    return d;
  };
  const ordered = [...parsed].sort((a, b) => depth(a) - depth(b) || a.id - b.id);

  let takenSlugs: Set<string> | null = null;

  for (const category of ordered) {
    const name = cleanLabel(category.name);
    const slug = safeDecodeURIComponent(category.slug);
    const parentExternalId = category.parent > 0 ? category.parent : null;
    const row = existing.get(category.id);

    if (row) {
      const changed =
        row.name !== name ||
        row.slug !== slug ||
        row.parentExternalId !== parentExternalId ||
        row.productCount !== category.count;
      if (changed) {
        await ctx.db
          .update(supplierCategories)
          .set({ name, slug, parentExternalId, productCount: category.count, updatedAt: ctx.now })
          .where(eq(supplierCategories.id, row.id));
      }
      ctx.categories.set(category.id, { externalId: category.id, parentExternalId, name, categoryId: row.categoryId });
      continue;
    }

    takenSlugs ??= new Set((await ctx.db.select({ slug: categories.slug }).from(categories)).map((r) => r.slug));
    const slugs = takenSlugs;
    const categoryId = await ctx.db.transaction(async (tx) => {
      let ourId: string | null = null;
      if (!getsNoCategory({ name, slug })) {
        const parentId = parentExternalId === null ? null : (ctx.categories.get(parentExternalId)?.categoryId ?? null);
        const [created] = await tx
          .insert(categories)
          .values({ name, slug: uniqueSlug(slugify(name) || `category-${category.id}`, slugs), parentId })
          .returning({ id: categories.id });
        ourId = created?.id ?? null;
      }
      await tx.insert(supplierCategories).values({
        supplierId: ctx.supplier.id,
        externalId: category.id,
        parentExternalId,
        name,
        slug,
        productCount: category.count,
        categoryId: ourId,
      });
      return ourId;
    });
    if (categoryId) ctx.categoriesChanged = true;
    ctx.categories.set(category.id, { externalId: category.id, parentExternalId, name, categoryId });
  }
}
