import { products, supplierCategories, supplierProducts, syncChanges } from "@ecommerce/database/schema";
import { and, eq, inArray } from "drizzle-orm";
import { resolveImages, supplierHostedImages, type ImageStore } from "../images";
import { isLockableField, type LockableProductField } from "../locks";
import type { Database, DbExecutor } from "../types";
import { loadAttributeIds } from "./attributes";
import {
  dismissOpenPriceChanges,
  renormalize,
  resolveCategoryId,
  setProductPrice,
  stockFields,
  writeSupplierAttributeValues,
  type CategoryInfo,
} from "./shared";

export class SyncReviewError extends Error {}

async function loadCategoryMap(db: DbExecutor, supplierId: string): Promise<Map<number, CategoryInfo>> {
  const rows = await db.select().from(supplierCategories).where(eq(supplierCategories.supplierId, supplierId));
  return new Map(
    rows.map((row) => [
      row.externalId,
      {
        externalId: row.externalId,
        parentExternalId: row.parentExternalId,
        name: row.name,
        categoryId: row.categoryId,
      },
    ]),
  );
}

async function followSupplierInTx(
  tx: DbExecutor,
  productId: string,
  field: LockableProductField,
  now: Date,
  imageStore: ImageStore,
): Promise<void> {
  const product = await tx.query.products.findFirst({
    where: eq(products.id, productId),
    columns: { id: true, lockedFields: true },
  });
  const link = await tx.query.supplierProducts.findFirst({
    where: eq(supplierProducts.productId, productId),
    with: { supplier: true },
  });
  if (!product || !link) throw new SyncReviewError("This product is not linked to a supplier product");
  const supplierProduct = renormalize(link.data);
  if (!supplierProduct) throw new SyncReviewError("The stored supplier data could not be read; run a full sync first");

  const patch: Partial<typeof products.$inferInsert> = {
    lockedFields: product.lockedFields.filter((locked) => locked !== field),
    updatedAt: now,
  };

  switch (field) {
    case "name":
      patch.name = supplierProduct.name;
      break;
    case "description":
      patch.description = supplierProduct.description;
      break;
    case "brand":
      patch.brand = supplierProduct.brand;
      break;
    case "images":
      patch.images = await resolveImages(imageStore, supplierProduct.images, link.supplier.slug);
      break;
    case "categoryId":
      patch.categoryId = resolveCategoryId(
        await loadCategoryMap(tx, link.supplierId),
        supplierProduct.categoryExternalIds,
      );
      break;
    case "stock":
      Object.assign(patch, stockFields(supplierProduct));
      break;
    case "price":
      await setProductPrice(
        tx,
        productId,
        supplierProduct.purchasable ? supplierProduct.priceAmount : null,
        supplierProduct.currency,
        now,
      );
      await dismissOpenPriceChanges(tx, link.id, now);
      break;
    case "attributes":
      await writeSupplierAttributeValues(
        tx,
        productId,
        supplierProduct.attributes,
        await loadAttributeIds(tx, link.supplierId),
      );
      break;
  }

  await tx.update(products).set(patch).where(eq(products.id, productId));

  // Any open "supplier changed a field you locked" entries for this field are now moot.
  await tx
    .update(syncChanges)
    .set({ status: "applied", resolvedAt: now, updatedAt: now })
    .where(
      and(
        eq(syncChanges.supplierProductId, link.id),
        eq(syncChanges.type, "locked_field_changed"),
        eq(syncChanges.field, field),
        eq(syncChanges.status, "pending"),
      ),
    );
}

/** Removes a lock and copies the supplier's current value into our product. */
export async function followSupplierForField(
  db: Database,
  productId: string,
  field: LockableProductField,
  options: { imageStore?: ImageStore } = {},
): Promise<void> {
  await db.transaction((tx) =>
    followSupplierInTx(tx, productId, field, new Date(), options.imageStore ?? supplierHostedImages),
  );
}

/**
 * Accepts a review-queue entry:
 * new_product / restored → publish our product; price_change → charge the supplier's price;
 * locked_field_changed → unlock the field and take the supplier's value.
 */
export async function applySyncChange(
  db: Database,
  changeId: string,
  userId: string | null,
  options: { imageStore?: ImageStore } = {},
): Promise<{ productId: string | null }> {
  return db.transaction(async (tx) => {
    const now = new Date();
    const [change] = await tx.select().from(syncChanges).where(eq(syncChanges.id, changeId)).for("update");
    if (!change) throw new SyncReviewError("Change not found");
    if (change.status !== "pending") throw new SyncReviewError("This change was already handled");

    if (change.productId) {
      switch (change.type) {
        case "new_product":
        case "restored":
          await tx.update(products).set({ active: true, updatedAt: now }).where(eq(products.id, change.productId));
          break;
        case "price_change": {
          const [link] = await tx
            .select({ currency: supplierProducts.currency })
            .from(supplierProducts)
            .where(eq(supplierProducts.id, change.supplierProductId));
          const amount = typeof change.newValue === "number" ? change.newValue : null;
          await setProductPrice(tx, change.productId, amount, link?.currency ?? "eur", now);
          const product = await tx.query.products.findFirst({
            where: eq(products.id, change.productId),
            columns: { lockedFields: true },
          });
          if (product?.lockedFields.includes("price")) {
            await tx
              .update(products)
              .set({ lockedFields: product.lockedFields.filter((f) => f !== "price"), updatedAt: now })
              .where(eq(products.id, change.productId));
          }
          break;
        }
        case "locked_field_changed":
          if (change.field && isLockableField(change.field)) {
            await followSupplierInTx(
              tx,
              change.productId,
              change.field,
              now,
              options.imageStore ?? supplierHostedImages,
            );
          }
          break;
        case "removed":
          break;
      }
    }

    await tx
      .update(syncChanges)
      .set({ status: "applied", resolvedBy: userId, resolvedAt: now, updatedAt: now })
      .where(eq(syncChanges.id, changeId));
    return { productId: change.productId };
  });
}

/** Rejects a review-queue entry: our product stays as it is (a new product stays a draft). */
export async function dismissSyncChange(
  db: Database,
  changeId: string,
  userId: string | null,
): Promise<{ productId: string | null }> {
  const now = new Date();
  const [change] = await db
    .update(syncChanges)
    .set({ status: "dismissed", resolvedBy: userId, resolvedAt: now, updatedAt: now })
    .where(and(eq(syncChanges.id, changeId), eq(syncChanges.status, "pending")))
    .returning({ productId: syncChanges.productId });
  if (!change) throw new SyncReviewError("Change not found or already handled");
  return { productId: change.productId };
}

/** Publishes every product waiting in the queue as "new" at once. */
export async function publishAllNewProducts(db: Database, userId: string | null): Promise<{ productIds: string[] }> {
  return db.transaction(async (tx) => {
    const now = new Date();
    const pending = await tx
      .update(syncChanges)
      .set({ status: "applied", resolvedBy: userId, resolvedAt: now, updatedAt: now })
      .where(and(eq(syncChanges.type, "new_product"), eq(syncChanges.status, "pending")))
      .returning({ productId: syncChanges.productId });
    const productIds = pending.map((row) => row.productId).filter((id): id is string => id !== null);
    if (productIds.length > 0) {
      await tx.update(products).set({ active: true, updatedAt: now }).where(inArray(products.id, productIds));
    }
    return { productIds };
  });
}
