import {
  supplierProducts,
  suppliers,
  syncRuns,
  type Supplier,
  type SyncRunError,
  type SyncRunStats,
} from "@ecommerce/database/schema";
import { and, eq, lt } from "drizzle-orm";
import { z } from "zod";
import { supplierHostedImages, type ImageStore } from "../images";
import { consoleLogger, type Logger } from "../logger";
import { hashNormalizedProduct, normalizeWooProduct } from "../normalize/product";
import { DEFAULT_SUPPLIER, getSupplierConfig, type SupplierConfig } from "../suppliers";
import type { Database } from "../types";
import { WooCommerceClient } from "../woocommerce/client";
import { wooProductSchema, type WpProductListing } from "../woocommerce/schemas";
import { ensureAttributes } from "./attributes";
import { syncCategories } from "./categories";
import { createFromSupplier, handleMissingProducts, updateFromSupplier, type FetchedProduct } from "./products";
import { emptyStats, errorMessage, recordFailure, type SyncContext } from "./shared";

export type SyncMode = "incremental" | "full";
export type SyncTrigger = "schedule" | "manual" | "cli";

export interface RunSupplierSyncOptions {
  db: Database;
  /** Supplier slug from SUPPLIERS; defaults to the only one we have. */
  supplier?: string;
  /**
   * incremental: list edit times (a few small requests) and download only new or edited products.
   * full: download every product. Run nightly to catch changes that don't touch the edit time (e.g. stock).
   */
  mode: SyncMode;
  trigger: SyncTrigger;
  /** Publish new products immediately instead of creating drafts that wait for review. */
  publishNew?: boolean;
  /** Price moves larger than this fraction of the current price wait for review. Default 0.10. */
  priceReviewThreshold?: number;
  /** Consecutive syncs a product must be missing from before we unpublish it. Default 2. */
  missingRunsBeforeRemoval?: number;
  imageStore?: ImageStore;
  logger?: Logger;
  fetch?: typeof fetch;
  requestDelayMs?: number;
  now?: () => Date;
}

export interface SyncRunResult {
  runId: string | null;
  status: "succeeded" | "failed" | "skipped";
  /** Why a run was skipped or failed. */
  message?: string;
  stats: SyncRunStats;
  errors: SyncRunError[];
  /** Our product ids whose storefront data changed, for cache revalidation. */
  changedProductIds: string[];
  categoriesChanged: boolean;
}

/** A run with no finish recorded after this long is considered dead (e.g. the function timed out). */
const STALE_RUN_MS = 30 * 60 * 1000;

/** Refuse to mark products as missing when the supplier suddenly lists fewer than this share of them. */
const MIN_LISTING_SHARE = 0.5;

async function ensureSupplier(db: Database, config: SupplierConfig): Promise<Supplier> {
  await db
    .insert(suppliers)
    .values({ slug: config.slug, name: config.name, baseUrl: config.baseUrl, platform: config.platform })
    .onConflictDoNothing({ target: suppliers.slug });
  const [supplier] = await db.select().from(suppliers).where(eq(suppliers.slug, config.slug)).limit(1);
  if (!supplier) throw new Error(`Supplier ${config.slug} could not be created`);
  return supplier;
}

const parseGmt = (value: string) => {
  const date = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const externalIdOf = (raw: unknown): number | undefined => {
  const id = (raw as { id?: unknown } | null)?.id;
  return typeof id === "number" ? id : undefined;
};

/**
 * One sync of a supplier's catalog into ours. Never throws for supplier or per-product
 * problems: the outcome is recorded in sync_run and returned.
 */
export async function runSupplierSync(options: RunSupplierSyncOptions): Promise<SyncRunResult> {
  const now = options.now?.() ?? new Date();
  const logger = options.logger ?? consoleLogger;
  const config = getSupplierConfig(options.supplier ?? DEFAULT_SUPPLIER);
  const db = options.db;
  const supplier = await ensureSupplier(db, config);

  const skipped = (message: string): SyncRunResult => ({
    runId: null,
    status: "skipped",
    message,
    stats: emptyStats(),
    errors: [],
    changedProductIds: [],
    categoriesChanged: false,
  });

  if (!supplier.active) return skipped(`${supplier.name} is switched off`);

  // One run at a time per supplier.
  await db
    .update(syncRuns)
    .set({ status: "failed", finishedAt: now, error: "Did not finish within 30 minutes" })
    .where(
      and(
        eq(syncRuns.supplierId, supplier.id),
        eq(syncRuns.status, "running"),
        lt(syncRuns.startedAt, new Date(now.getTime() - STALE_RUN_MS)),
      ),
    );
  const [running] = await db
    .select({ id: syncRuns.id })
    .from(syncRuns)
    .where(and(eq(syncRuns.supplierId, supplier.id), eq(syncRuns.status, "running")))
    .limit(1);
  if (running) return skipped("Another sync of this supplier is still running");

  const [run] = await db
    .insert(syncRuns)
    .values({ supplierId: supplier.id, mode: options.mode, trigger: options.trigger, startedAt: now })
    .returning({ id: syncRuns.id });
  if (!run) throw new Error("Could not record the sync run");

  const ctx: SyncContext = {
    db,
    supplier,
    runId: run.id,
    now,
    publishNew: options.publishNew ?? false,
    priceReviewThreshold: options.priceReviewThreshold ?? 0.1,
    missingRunsBeforeRemoval: options.missingRunsBeforeRemoval ?? 2,
    imageStore: options.imageStore ?? supplierHostedImages,
    logger,
    stats: emptyStats(),
    errors: [],
    changedProductIds: new Set(),
    categories: new Map(),
    attributeIds: new Map(),
    categoriesChanged: false,
  };

  const client = new WooCommerceClient({
    baseUrl: config.baseUrl,
    fetch: options.fetch,
    delayMs: options.requestDelayMs,
    logger,
  });

  const finish = async (status: "succeeded" | "failed", message?: string): Promise<SyncRunResult> => {
    await db
      .update(syncRuns)
      .set({ status, finishedAt: new Date(), stats: ctx.stats, errors: ctx.errors, error: message ?? null })
      .where(eq(syncRuns.id, run.id));
    return {
      runId: run.id,
      status,
      message,
      stats: ctx.stats,
      errors: ctx.errors,
      changedProductIds: [...ctx.changedProductIds],
      categoriesChanged: ctx.categoriesChanged,
    };
  };

  try {
    logger.info(`Starting ${options.mode} sync of ${supplier.name}`);
    await syncCategories(ctx, await client.listCategories());

    // Which products exist, and when each was last edited.
    let listing: WpProductListing[] | null = null;
    try {
      listing = await client.listProductEditTimes();
    } catch (error) {
      logger.warn("Could not list product edit times; falling back to a full download", {
        error: errorMessage(error),
      });
    }

    const storedRows = await db.select().from(supplierProducts).where(eq(supplierProducts.supplierId, supplier.id));
    const stored = new Map(storedRows.map((row) => [row.externalId, row]));
    const editTimes = new Map<number, Date | null>((listing ?? []).map((l) => [l.id, parseGmt(l.modified_gmt)]));

    let rawProducts: unknown[];
    let presentIds: number[];
    if (options.mode === "full" || listing === null) {
      rawProducts = await client.listProducts();
      presentIds = listing ? listing.map((l) => l.id) : rawProducts.map(externalIdOf).filter((id) => id !== undefined);
    } else {
      presentIds = listing.map((l) => l.id);
      const toFetch = listing
        .filter((l) => {
          const row = stored.get(l.id);
          if (!row || row.removedAt !== null) return true;
          return row.supplierModifiedAt?.getTime() !== editTimes.get(l.id)?.getTime();
        })
        .map((l) => l.id);
      rawProducts = toFetch.length > 0 ? await client.getProducts(toFetch) : [];
    }
    ctx.stats.seen = presentIds.length;
    ctx.stats.fetched = rawProducts.length;

    const tracked = storedRows.filter((row) => row.removedAt === null).length;
    if (tracked > 0 && presentIds.length < tracked * MIN_LISTING_SHARE) {
      throw new Error(
        `The supplier listed only ${presentIds.length} products while we track ${tracked}. ` +
          "Stopping so nothing is unpublished by mistake; the next run will try again.",
      );
    }

    const fetched: FetchedProduct[] = [];
    for (const raw of rawProducts) {
      const parsed = wooProductSchema.safeParse(raw);
      if (!parsed.success) {
        recordFailure(ctx, externalIdOf(raw), `Unexpected product data: ${z.prettifyError(parsed.error)}`);
        continue;
      }
      try {
        const product = normalizeWooProduct(parsed.data);
        fetched.push({ raw: raw as Record<string, unknown>, product, hash: hashNormalizedProduct(product) });
      } catch (error) {
        recordFailure(ctx, parsed.data.id, errorMessage(error));
      }
    }

    await ensureAttributes(
      ctx,
      fetched.map((item) => item.product),
    );

    for (const item of fetched) {
      const existing = stored.get(item.product.externalId);
      const modifiedAt = editTimes.get(item.product.externalId) ?? existing?.supplierModifiedAt ?? null;
      try {
        if (existing) await updateFromSupplier(ctx, existing, item, modifiedAt);
        else await createFromSupplier(ctx, item, modifiedAt);
      } catch (error) {
        recordFailure(ctx, item.product.externalId, errorMessage(error));
      }
    }

    await handleMissingProducts(ctx, presentIds);

    await db
      .update(suppliers)
      .set({ lastSyncedAt: now, ...(options.mode === "full" ? { lastFullSyncAt: now } : {}), updatedAt: now })
      .where(eq(suppliers.id, supplier.id));

    logger.info(`Finished ${options.mode} sync of ${supplier.name}`, { ...ctx.stats });
    return await finish("succeeded");
  } catch (error) {
    const message = errorMessage(error);
    logger.error(`Sync of ${supplier.name} failed`, { error: message });
    return await finish("failed", message);
  }
}
