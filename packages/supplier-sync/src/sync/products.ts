import { products, supplierProducts, type SupplierProduct } from "@ecommerce/database/schema";
import { and, eq, inArray, isNull, notInArray, sql } from "drizzle-orm";
import { resolveImages } from "../images";
import type { LockableProductField } from "../locks";
import { refreshProductMedia } from "../media";
import { isSameValue, type NormalizedProduct } from "../normalize/product";
import {
  categoryNames,
  currentPriceAmount,
  dismissOpenPriceChanges,
  recordChange,
  renormalize,
  resolveCategoryId,
  setProductPrice,
  stockFields,
  uniqueProductSlug,
  writeSupplierAttributeValues,
  type SyncContext,
} from "./shared";

export type FetchedProduct = {
  raw: Record<string, unknown>;
  product: NormalizedProduct;
  hash: string;
};

function snapshot(ctx: SyncContext, item: FetchedProduct, modifiedAt: Date | null) {
  const p = item.product;
  return {
    supplierId: ctx.supplier.id,
    externalId: p.externalId,
    name: p.name,
    permalink: p.permalink,
    sku: p.sku,
    priceAmount: p.priceAmount,
    regularPriceAmount: p.regularPriceAmount,
    currency: p.currency,
    inStock: p.inStock,
    onBackorder: p.onBackorder,
    purchasable: p.purchasable,
    categoryExternalIds: p.categoryExternalIds,
    data: item.raw,
    contentHash: item.hash,
    supplierModifiedAt: modifiedAt,
    lastSeenAt: ctx.now,
    missingCount: 0,
    updatedAt: ctx.now,
  };
}

/** A product we have never seen: create ours (a draft unless publishNew) and queue it for review. */
export async function createFromSupplier(ctx: SyncContext, item: FetchedProduct, modifiedAt: Date | null) {
  const p = item.product;
  const images = await resolveImages(ctx.imageStore, p.images, ctx.supplier.slug);
  const categoryId = resolveCategoryId(ctx.categories, p.categoryExternalIds);

  const productId = await ctx.db.transaction(async (tx) => {
    const [product] = await tx
      .insert(products)
      .values({
        name: p.name,
        slug: await uniqueProductSlug(tx, p.name),
        description: p.description,
        images,
        categoryId,
        brand: p.brand,
        active: ctx.publishNew,
        type: "good",
        shippable: true,
        ...stockFields(p),
      })
      .returning({ id: products.id });
    if (!product) throw new Error("Could not create product");

    if (p.priceAmount !== null && p.purchasable) {
      await setProductPrice(tx, product.id, p.priceAmount, p.currency, ctx.now);
    }
    await writeSupplierAttributeValues(tx, product.id, p.attributes, ctx.attributeIds);

    const [row] = await tx
      .insert(supplierProducts)
      .values({ ...snapshot(ctx, item, modifiedAt), productId: product.id, firstSeenAt: ctx.now })
      .returning({ id: supplierProducts.id });
    if (!row) throw new Error("Could not store supplier product");

    await recordChange(tx, ctx, {
      supplierProductId: row.id,
      productId: product.id,
      type: "new_product",
      newValue: { name: p.name, priceAmount: p.priceAmount },
      status: ctx.publishNew ? "applied" : "pending",
    });
    ctx.changedProductIds.add(product.id);
    return product.id;
  });
  // Which of its images are photos, icons or tables, from what is already known about them.
  await refreshProductMedia(ctx.db, [productId]);
  ctx.stats.created += 1;
}

/**
 * A product we already track. Fields the supplier changed are copied to ours unless we locked
 * them (then the change is queued for review instead). Prices follow the review threshold.
 */
export async function updateFromSupplier(
  ctx: SyncContext,
  existing: SupplierProduct,
  item: FetchedProduct,
  modifiedAt: Date | null,
) {
  const restored = existing.removedAt !== null;

  if (existing.contentHash === item.hash && !restored) {
    // Nothing we use changed. Only remember a new edit time (so incremental runs stop re-downloading
    // it); last-seen bookkeeping for every listed product happens in one query in handleMissingProducts.
    if (existing.supplierModifiedAt?.getTime() !== modifiedAt?.getTime()) {
      await ctx.db
        .update(supplierProducts)
        .set({ data: item.raw, supplierModifiedAt: modifiedAt, updatedAt: ctx.now })
        .where(eq(supplierProducts.id, existing.id));
    }
    ctx.stats.unchanged += 1;
    return;
  }

  const next = item.product;
  // What the supplier said last time. If the old payload no longer parses, treat every field as changed.
  const prev = renormalize(existing.data);
  const imagesChanged = !prev || !isSameValue(prev.images, next.images);
  const images = imagesChanged ? await resolveImages(ctx.imageStore, next.images, ctx.supplier.slug) : null;

  let imagesPatched = false;
  await ctx.db.transaction(async (tx) => {
    const product = existing.productId
      ? await tx.query.products.findFirst({
          where: eq(products.id, existing.productId),
          columns: { id: true, lockedFields: true },
        })
      : undefined;

    if (product) {
      const locked = new Set(product.lockedFields);
      const patch: Partial<typeof products.$inferInsert> = {};
      const lockedChanges: Array<{ field: LockableProductField; previousValue: unknown; newValue: unknown }> = [];
      let rewriteAttributes = false;
      let productChanged = false;

      const consider = (field: LockableProductField, before: unknown, after: unknown, apply: () => void) => {
        if (prev && isSameValue(before, after)) return;
        if (locked.has(field)) {
          if (prev) lockedChanges.push({ field, previousValue: before, newValue: after });
          return;
        }
        apply();
      };

      consider("name", prev?.name, next.name, () => {
        patch.name = next.name;
      });
      consider("description", prev?.description, next.description, () => {
        patch.description = next.description;
      });
      consider("brand", prev?.brand, next.brand, () => {
        patch.brand = next.brand;
      });
      consider(
        "images",
        prev?.images.map((i) => i.src),
        next.images.map((i) => i.src),
        () => {
          if (images) {
            patch.images = images;
            imagesPatched = true;
          }
        },
      );
      consider(
        "categoryId",
        prev ? categoryNames(ctx.categories, prev.categoryExternalIds) : undefined,
        categoryNames(ctx.categories, next.categoryExternalIds),
        () => {
          patch.categoryId = resolveCategoryId(ctx.categories, next.categoryExternalIds);
        },
      );
      consider("stock", prev ? stockFields(prev) : undefined, stockFields(next), () => {
        Object.assign(patch, stockFields(next));
      });
      consider("attributes", prev?.attributes, next.attributes, () => {
        rewriteAttributes = true;
      });

      // Price: compare with what customers pay now, so a pending big move can't slip through in small steps.
      const nextPrice = next.purchasable ? next.priceAmount : null;
      if (locked.has("price")) {
        const prevPrice = prev ? (prev.purchasable ? prev.priceAmount : null) : undefined;
        if (prevPrice !== undefined && prevPrice !== nextPrice) {
          lockedChanges.push({ field: "price", previousValue: prevPrice, newValue: nextPrice });
        }
      } else {
        const ours = await currentPriceAmount(tx, product.id);
        if (ours === nextPrice) {
          await dismissOpenPriceChanges(tx, existing.id, ctx.now);
        } else if (nextPrice === null) {
          // No price any more ("price on request" or not purchasable): stop selling at the old price.
          await setProductPrice(tx, product.id, null, next.currency, ctx.now);
          await dismissOpenPriceChanges(tx, existing.id, ctx.now);
          await recordChange(tx, ctx, {
            supplierProductId: existing.id,
            productId: product.id,
            type: "price_change",
            field: "price",
            previousValue: ours,
            newValue: null,
            status: "applied",
          });
          productChanged = true;
        } else if (ours !== null && Math.abs(nextPrice - ours) / ours <= ctx.priceReviewThreshold) {
          await setProductPrice(tx, product.id, nextPrice, next.currency, ctx.now);
          await dismissOpenPriceChanges(tx, existing.id, ctx.now);
          await recordChange(tx, ctx, {
            supplierProductId: existing.id,
            productId: product.id,
            type: "price_change",
            field: "price",
            previousValue: ours,
            newValue: nextPrice,
            status: "applied",
          });
          productChanged = true;
        } else {
          await recordChange(tx, ctx, {
            supplierProductId: existing.id,
            productId: product.id,
            type: "price_change",
            field: "price",
            previousValue: ours,
            newValue: nextPrice,
            status: "pending",
          });
        }
      }

      for (const change of lockedChanges) {
        await recordChange(tx, ctx, {
          supplierProductId: existing.id,
          productId: product.id,
          type: "locked_field_changed",
          field: change.field,
          previousValue: change.previousValue,
          newValue: change.newValue,
          status: "pending",
        });
      }

      if (Object.keys(patch).length > 0) {
        await tx
          .update(products)
          .set({ ...patch, updatedAt: ctx.now })
          .where(eq(products.id, product.id));
        productChanged = true;
      }
      if (rewriteAttributes) {
        await writeSupplierAttributeValues(tx, product.id, next.attributes, ctx.attributeIds);
        productChanged = true;
      }
      if (restored) {
        await recordChange(tx, ctx, {
          supplierProductId: existing.id,
          productId: product.id,
          type: "restored",
          newValue: { name: next.name, priceAmount: nextPrice },
          status: "pending",
        });
      }
      if (productChanged) ctx.changedProductIds.add(product.id);
    }

    await tx
      .update(supplierProducts)
      .set({ ...snapshot(ctx, item, modifiedAt), removedAt: null })
      .where(eq(supplierProducts.id, existing.id));
  });

  if (imagesPatched && existing.productId) await refreshProductMedia(ctx.db, [existing.productId]);
  if (restored) ctx.stats.restored += 1;
  else ctx.stats.updated += 1;
}

/**
 * Products the supplier no longer lists. After `missingRunsBeforeRemoval` consecutive misses,
 * ours is unpublished and the removal is logged. One miss alone is ignored (a product
 * briefly hidden while the supplier edits it shouldn't flicker off our store).
 */
export async function handleMissingProducts(ctx: SyncContext, presentIds: readonly number[]): Promise<void> {
  const ofSupplier = eq(supplierProducts.supplierId, ctx.supplier.id);

  if (presentIds.length > 0) {
    await ctx.db
      .update(supplierProducts)
      .set({ missingCount: 0, lastSeenAt: ctx.now })
      .where(and(ofSupplier, inArray(supplierProducts.externalId, [...presentIds])));
  }

  const missing = await ctx.db
    .update(supplierProducts)
    .set({ missingCount: sql`${supplierProducts.missingCount} + 1`, updatedAt: ctx.now })
    .where(
      and(
        ofSupplier,
        isNull(supplierProducts.removedAt),
        presentIds.length > 0 ? notInArray(supplierProducts.externalId, [...presentIds]) : undefined,
      ),
    )
    .returning({
      id: supplierProducts.id,
      productId: supplierProducts.productId,
      missingCount: supplierProducts.missingCount,
      name: supplierProducts.name,
    });

  for (const row of missing) {
    if (row.missingCount < ctx.missingRunsBeforeRemoval) continue;
    await ctx.db.transaction(async (tx) => {
      await tx
        .update(supplierProducts)
        .set({ removedAt: ctx.now, updatedAt: ctx.now })
        .where(eq(supplierProducts.id, row.id));
      if (row.productId) {
        await tx.update(products).set({ active: false, updatedAt: ctx.now }).where(eq(products.id, row.productId));
        ctx.changedProductIds.add(row.productId);
      }
      await recordChange(tx, ctx, {
        supplierProductId: row.id,
        productId: row.productId,
        type: "removed",
        previousValue: { name: row.name },
        status: "applied",
      });
    });
    ctx.stats.removed += 1;
  }
}
