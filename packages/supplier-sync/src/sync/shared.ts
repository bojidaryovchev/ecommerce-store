import {
  prices,
  productAttributeValues,
  products,
  syncChanges,
  type Supplier,
  type SyncRunError,
  type SyncRunStats,
} from "@ecommerce/database/schema";
import { and, eq, isNull, like, or } from "drizzle-orm";
import type { ImageStore } from "../images";
import type { Logger } from "../logger";
import type { NormalizedAttribute } from "../normalize/product";
import { normalizeWooProduct, type NormalizedProduct } from "../normalize/product";
import { slugify } from "../normalize/transliterate";
import type { Database, DbExecutor } from "../types";
import { wooProductSchema } from "../woocommerce/schemas";

export type CategoryInfo = {
  externalId: number;
  parentExternalId: number | null;
  name: string;
  categoryId: string | null;
};

/** State shared by the steps of one sync run. */
export interface SyncContext {
  db: Database;
  supplier: Supplier;
  runId: string;
  /** Start of the run; used for every timestamp the run writes. */
  now: Date;
  publishNew: boolean;
  priceReviewThreshold: number;
  missingRunsBeforeRemoval: number;
  imageStore: ImageStore;
  logger: Logger;
  stats: SyncRunStats;
  errors: SyncRunError[];
  changedProductIds: Set<string>;
  categories: Map<number, CategoryInfo>;
  /** supplier attribute key → our attribute id */
  attributeIds: Map<string, string>;
  categoriesChanged: boolean;
}

export function emptyStats(): SyncRunStats {
  return {
    seen: 0,
    fetched: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    removed: 0,
    restored: 0,
    failed: 0,
    pendingReview: 0,
  };
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const MAX_RECORDED_ERRORS = 100;

export function recordFailure(ctx: SyncContext, externalId: number | undefined, message: string): void {
  ctx.stats.failed += 1;
  ctx.logger.warn("Product failed", { externalId, message });
  if (ctx.errors.length < MAX_RECORDED_ERRORS) ctx.errors.push({ externalId, message });
}

/** Re-reads a stored raw payload with the current normaliser; null if it no longer parses. */
export function renormalize(data: unknown): NormalizedProduct | null {
  const parsed = wooProductSchema.safeParse(data);
  return parsed.success ? normalizeWooProduct(parsed.data) : null;
}

export function uniqueSlug(base: string, taken: Set<string>): string {
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  taken.add(slug);
  return slug;
}

function categoryDepth(categories: Map<number, CategoryInfo>, externalId: number): number {
  let depth = 0;
  const seen = new Set<number>([externalId]);
  let parent = categories.get(externalId)?.parentExternalId ?? null;
  while (parent !== null && !seen.has(parent)) {
    seen.add(parent);
    depth += 1;
    parent = categories.get(parent)?.parentExternalId ?? null;
  }
  return depth;
}

/** Our category for a product: the most specific of its supplier categories that maps to one of ours. */
export function resolveCategoryId(
  categories: Map<number, CategoryInfo>,
  externalIds: readonly number[],
): string | null {
  let best: { categoryId: string; depth: number } | null = null;
  for (const externalId of externalIds) {
    const categoryId = categories.get(externalId)?.categoryId;
    if (!categoryId) continue;
    const depth = categoryDepth(categories, externalId);
    if (best === null || depth > best.depth) best = { categoryId, depth };
  }
  return best?.categoryId ?? null;
}

export function categoryNames(categories: Map<number, CategoryInfo>, externalIds: readonly number[]): string[] {
  return externalIds.map((id) => categories.get(id)?.name ?? `#${id}`);
}

/** How a supplier's availability maps onto our inventory fields (the storefront and checkout already respect these). */
export function stockFields(product: Pick<NormalizedProduct, "inStock" | "onBackorder">): {
  trackInventory: boolean;
  stockQuantity: number | null;
} {
  const unavailable = !product.inStock && !product.onBackorder;
  return { trackInventory: unavailable, stockQuantity: unavailable ? 0 : null };
}

/** The price customers currently pay for a product (its active default price), in cents. */
export async function currentPriceAmount(tx: DbExecutor, productId: string): Promise<number | null> {
  const product = await tx.query.products.findFirst({
    where: eq(products.id, productId),
    columns: { id: true },
    with: { defaultPrice: true },
  });
  const price = product?.defaultPrice;
  return price && price.active ? price.unitAmount : null;
}

/** Sets a product's default price (creating it if needed); null deactivates it, so the product can't be bought. */
export async function setProductPrice(
  tx: DbExecutor,
  productId: string,
  amount: number | null,
  currency: string,
  now: Date,
): Promise<void> {
  const product = await tx.query.products.findFirst({
    where: eq(products.id, productId),
    columns: { id: true, defaultPriceId: true },
  });
  if (!product) return;

  if (amount === null) {
    if (product.defaultPriceId) {
      await tx.update(prices).set({ active: false, updatedAt: now }).where(eq(prices.id, product.defaultPriceId));
    }
    return;
  }

  if (product.defaultPriceId) {
    const updated = await tx
      .update(prices)
      .set({ unitAmount: amount, unitAmountDecimal: String(amount), currency, active: true, updatedAt: now })
      .where(eq(prices.id, product.defaultPriceId))
      .returning({ id: prices.id });
    if (updated.length > 0) return;
  }

  const [price] = await tx
    .insert(prices)
    .values({
      productId,
      currency,
      unitAmount: amount,
      unitAmountDecimal: String(amount),
      type: "one_time",
      taxBehavior: "inclusive",
      active: true,
    })
    .returning({ id: prices.id });
  if (!price) throw new Error("Could not create price");
  await tx.update(products).set({ defaultPriceId: price.id, updatedAt: now }).where(eq(products.id, productId));
}

/** Replaces a product's supplier-sourced attribute values; values added by hand are kept. */
export async function writeSupplierAttributeValues(
  tx: DbExecutor,
  productId: string,
  attributes: readonly NormalizedAttribute[],
  attributeIds: ReadonlyMap<string, string>,
): Promise<void> {
  await tx
    .delete(productAttributeValues)
    .where(and(eq(productAttributeValues.productId, productId), eq(productAttributeValues.source, "supplier")));

  const rows: Array<typeof productAttributeValues.$inferInsert> = [];
  for (const attribute of attributes) {
    const attributeId = attributeIds.get(attribute.key);
    if (!attributeId) continue;
    attribute.values.forEach((value, index) => {
      rows.push({
        productId,
        attributeId,
        value: value.text,
        numericValue: value.number,
        source: "supplier",
        sortOrder: index,
      });
    });
  }
  if (rows.length > 0) await tx.insert(productAttributeValues).values(rows).onConflictDoNothing();
}

type ChangeValues = {
  supplierProductId: string;
  productId: string | null;
  type: (typeof syncChanges.$inferInsert)["type"];
  field?: string | null;
  previousValue?: unknown;
  newValue?: unknown;
  status: "pending" | "applied";
};

/**
 * Logs a change. A pending change replaces an earlier pending one of the same kind for the
 * same product (keeping its "before" value), so the queue shows one row per open decision.
 */
export async function recordChange(tx: DbExecutor, ctx: SyncContext, change: ChangeValues): Promise<void> {
  const field = change.field ?? null;
  if (change.status === "pending") {
    ctx.stats.pendingReview += 1;
    const [open] = await tx
      .select({ id: syncChanges.id })
      .from(syncChanges)
      .where(
        and(
          eq(syncChanges.supplierProductId, change.supplierProductId),
          eq(syncChanges.type, change.type),
          field === null ? isNull(syncChanges.field) : eq(syncChanges.field, field),
          eq(syncChanges.status, "pending"),
        ),
      )
      .limit(1);
    if (open) {
      await tx
        .update(syncChanges)
        .set({ newValue: change.newValue ?? null, runId: ctx.runId, updatedAt: ctx.now })
        .where(eq(syncChanges.id, open.id));
      return;
    }
  }
  await tx.insert(syncChanges).values({
    supplierId: ctx.supplier.id,
    runId: ctx.runId,
    supplierProductId: change.supplierProductId,
    productId: change.productId,
    type: change.type,
    field,
    previousValue: change.previousValue ?? null,
    newValue: change.newValue ?? null,
    status: change.status,
    resolvedAt: change.status === "applied" ? ctx.now : null,
    createdAt: ctx.now,
    updatedAt: ctx.now,
  });
}

/** Closes open price reviews for a product once they no longer apply (e.g. the supplier reverted). */
export async function dismissOpenPriceChanges(tx: DbExecutor, supplierProductId: string, now: Date): Promise<void> {
  await tx
    .update(syncChanges)
    .set({ status: "dismissed", resolvedAt: now, updatedAt: now })
    .where(
      and(
        eq(syncChanges.supplierProductId, supplierProductId),
        eq(syncChanges.type, "price_change"),
        eq(syncChanges.status, "pending"),
      ),
    );
}

/**
 * A free URL slug for a product named `name`: "Пелетна камина ARTEL" → "peletna-kamina-artel",
 * or "…-2", "…-3" when taken. Slugs never change afterwards, so product URLs stay stable.
 */
export async function uniqueProductSlug(db: DbExecutor, name: string): Promise<string> {
  const base = slugify(name) || "product";
  const taken = new Set(
    (
      await db
        .select({ slug: products.slug })
        .from(products)
        .where(or(eq(products.slug, base), like(products.slug, `${base}-%`)))
    ).map((row) => row.slug),
  );
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}
