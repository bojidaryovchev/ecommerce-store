import { categories, products, supplierCategories, supplierProducts, suppliers } from "@ecommerce/database/schema";
import { and, eq, inArray, isNull, notInArray } from "drizzle-orm";
import { CATEGORY_TREES, type CuratedCategory } from "../curation";
import type { Database, DbExecutor } from "../types";
import { resolveCategoryId, type CategoryInfo } from "./shared";

/**
 * Our category for a curated slug, creating it (and its parents) when missing.
 * Used by the sync when a supplier category listed in the curated tree appears for the first time.
 */
export async function ensureCuratedCategory(
  tx: DbExecutor,
  tree: readonly CuratedCategory[],
  slug: string,
): Promise<string> {
  const entry = tree.find((category) => category.slug === slug);
  if (!entry) throw new Error(`Unknown curated category ${slug}`);
  const [existing] = await tx
    .select({ id: categories.id, deletedAt: categories.deletedAt })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  if (existing) {
    if (existing.deletedAt) {
      await tx.update(categories).set({ deletedAt: null, updatedAt: new Date() }).where(eq(categories.id, existing.id));
    }
    return existing.id;
  }
  const parentId = entry.parent ? await ensureCuratedCategory(tx, tree, entry.parent) : null;
  const [created] = await tx
    .insert(categories)
    .values({ name: entry.name, slug, parentId, sortOrder: tree.indexOf(entry) })
    .returning({ id: categories.id });
  if (!created) throw new Error(`Could not create category ${slug}`);
  return created.id;
}

/** The curated slug a supplier category belongs to, if any. */
export function curatedSlugFor(tree: readonly CuratedCategory[], supplierCategoryId: number): string | undefined {
  return tree.find((category) => category.supplierCategoryIds?.includes(supplierCategoryId))?.slug;
}

export type ApplyCategoryTreeResult = {
  created: number;
  updated: number;
  remapped: number;
  productsMoved: number;
  retired: number;
};

/**
 * Brings an existing catalog in line with the curated tree (idempotent):
 * 1. every curated category exists with its name, slug, parent and order — reusing the category that
 *    already has the slug, else the one its supplier categories map to, so ids and admin edits survive;
 * 2. the listed supplier categories map to it;
 * 3. synced products move to the category their supplier categories now resolve to, unless an admin
 *    locked the product's category;
 * 4. categories the sync had created that are now unmapped and empty are retired (soft-deleted).
 * Categories created by hand are never touched.
 */
export async function applyCategoryTree(
  db: Database,
  supplierSlug: string,
  /** Defaults to the supplier's tree in src/curation.ts. */
  treeOverride?: readonly CuratedCategory[],
): Promise<ApplyCategoryTreeResult> {
  const tree = treeOverride ?? CATEGORY_TREES[supplierSlug];
  if (!tree) throw new Error(`No category tree for supplier "${supplierSlug}"`);
  const [supplier] = await db.select().from(suppliers).where(eq(suppliers.slug, supplierSlug)).limit(1);
  if (!supplier) throw new Error(`Supplier "${supplierSlug}" has not been synced yet`);

  return db.transaction(async (tx) => {
    const now = new Date();
    const result: ApplyCategoryTreeResult = { created: 0, updated: 0, remapped: 0, productsMoved: 0, retired: 0 };

    const mappings = await tx.select().from(supplierCategories).where(eq(supplierCategories.supplierId, supplier.id));
    const previouslyMapped = new Set(mappings.map((m) => m.categoryId).filter((id): id is string => id !== null));
    const all = await tx.select().from(categories);
    const bySlug = new Map(all.map((category) => [category.slug, category]));
    const claimed = new Map<string, string>(); // curated slug → our category id

    for (const [index, entry] of tree.entries()) {
      const parentId = entry.parent ? (claimed.get(entry.parent) ?? null) : null;
      // Reuse: the category holding this slug, else the one a listed supplier category maps to.
      let category = bySlug.get(entry.slug);
      if (!category || [...claimed.values()].includes(category.id)) {
        const mappedId = mappings.find(
          (m) =>
            m.categoryId &&
            entry.supplierCategoryIds?.includes(m.externalId) &&
            ![...claimed.values()].includes(m.categoryId),
        )?.categoryId;
        category = mappedId ? all.find((c) => c.id === mappedId) : undefined;
      }

      if (category) {
        // Free the slug if another category holds it.
        const holder = bySlug.get(entry.slug);
        if (holder && holder.id !== category.id) {
          const freed = `${holder.slug}-${holder.id.slice(0, 6)}`;
          await tx.update(categories).set({ slug: freed, updatedAt: now }).where(eq(categories.id, holder.id));
          bySlug.delete(entry.slug);
          bySlug.set(freed, { ...holder, slug: freed });
        }
        const changed =
          category.name !== entry.name ||
          category.slug !== entry.slug ||
          category.parentId !== parentId ||
          category.sortOrder !== index ||
          category.deletedAt !== null;
        if (changed) {
          await tx
            .update(categories)
            .set({ name: entry.name, slug: entry.slug, parentId, sortOrder: index, deletedAt: null, updatedAt: now })
            .where(eq(categories.id, category.id));
          result.updated += 1;
        }
        bySlug.delete(category.slug);
        bySlug.set(entry.slug, { ...category, slug: entry.slug });
        claimed.set(entry.slug, category.id);
      } else {
        const [created] = await tx
          .insert(categories)
          .values({ name: entry.name, slug: entry.slug, parentId, sortOrder: index })
          .returning();
        if (!created) throw new Error(`Could not create category ${entry.slug}`);
        bySlug.set(entry.slug, created);
        claimed.set(entry.slug, created.id);
        result.created += 1;
      }
    }

    // Map supplier categories.
    for (const entry of tree) {
      const categoryId = claimed.get(entry.slug)!;
      for (const externalId of entry.supplierCategoryIds ?? []) {
        const mapping = mappings.find((m) => m.externalId === externalId);
        if (mapping && mapping.categoryId !== categoryId) {
          await tx
            .update(supplierCategories)
            .set({ categoryId, updatedAt: now })
            .where(eq(supplierCategories.id, mapping.id));
          mapping.categoryId = categoryId;
          result.remapped += 1;
        }
      }
    }

    // Move synced products to the category their supplier categories now resolve to.
    const categoryInfo = new Map<number, CategoryInfo>(
      mappings.map((m) => [
        m.externalId,
        { externalId: m.externalId, parentExternalId: m.parentExternalId, name: m.name, categoryId: m.categoryId },
      ]),
    );
    const linked = await tx
      .select({
        productId: products.id,
        categoryId: products.categoryId,
        lockedFields: products.lockedFields,
        externalIds: supplierProducts.categoryExternalIds,
      })
      .from(supplierProducts)
      .innerJoin(products, eq(products.id, supplierProducts.productId))
      .where(eq(supplierProducts.supplierId, supplier.id));
    for (const row of linked) {
      if (row.lockedFields.includes("categoryId")) continue;
      const target = resolveCategoryId(categoryInfo, row.externalIds);
      if (target !== row.categoryId) {
        await tx.update(products).set({ categoryId: target, updatedAt: now }).where(eq(products.id, row.productId));
        result.productsMoved += 1;
      }
    }

    // Retire categories the sync had created that nothing maps to and that hold no products.
    const stillMapped = new Set(mappings.map((m) => m.categoryId).filter((id): id is string => id !== null));
    const curatedIds = new Set(claimed.values());
    const candidates = [...previouslyMapped].filter((id) => !stillMapped.has(id) && !curatedIds.has(id));
    if (candidates.length > 0) {
      const withProducts = new Set(
        (
          await tx
            .select({ categoryId: products.categoryId })
            .from(products)
            .where(inArray(products.categoryId, candidates))
        ).map((row) => row.categoryId),
      );
      const withChildren = new Set(
        (
          await tx
            .select({ parentId: categories.parentId })
            .from(categories)
            .where(
              and(
                inArray(categories.parentId, candidates),
                isNull(categories.deletedAt),
                notInArray(categories.id, candidates),
              ),
            )
        ).map((row) => row.parentId),
      );
      const retire = candidates.filter((id) => !withProducts.has(id) && !withChildren.has(id));
      if (retire.length > 0) {
        const retired = await tx
          .update(categories)
          .set({ deletedAt: now, updatedAt: now })
          .where(and(inArray(categories.id, retire), isNull(categories.deletedAt)))
          .returning({ id: categories.id });
        result.retired = retired.length;
      }
    }

    return result;
  });
}
