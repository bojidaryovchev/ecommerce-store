import * as schema from "@ecommerce/database/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { DbExecutor } from "../types";
import type { ImageKind } from "./contract";
import { hashOf, type EnrichProduct, type Stage, type StageRow } from "./state";

/**
 * Writes of the enrichment pipeline. Every write is one product's one stage (an upsert on product and
 * stage), so a run that stops part-way leaves finished products finished.
 */

export interface StageWrite {
  status: "succeeded" | "flagged" | "failed";
  inputsHash: string;
  output: unknown;
  errors: string[];
  model: string | null;
  startedAt: Date;
  finishedAt: Date;
}

export async function saveStage(
  db: DbExecutor,
  productId: string,
  stage: Exclude<Stage, "publish">,
  write: StageWrite,
): Promise<void> {
  const failed = write.status === "failed";
  const values = {
    productId,
    stage,
    status: write.status,
    inputsHash: write.inputsHash,
    output: write.output ?? null,
    errors: write.errors,
    attempts: failed ? 1 : 0,
    model: write.model,
    startedAt: write.startedAt,
    finishedAt: write.finishedAt,
    updatedAt: write.finishedAt,
  };
  await db
    .insert(schema.productEnrichments)
    .values(values)
    .onConflictDoUpdate({
      target: [schema.productEnrichments.productId, schema.productEnrichments.stage],
      set: {
        status: values.status,
        inputsHash: values.inputsHash,
        // A failure keeps the last good output for the review page; anything else replaces it.
        ...(failed ? {} : { output: values.output }),
        errors: values.errors,
        attempts: failed ? sql`${schema.productEnrichments.attempts} + 1` : 0,
        model: values.model,
        startedAt: values.startedAt,
        finishedAt: values.finishedAt,
        updatedAt: values.updatedAt,
      },
    });
}

/** What each image shows. A person's decision (source "manual") is never overwritten. */
export async function saveImageKinds(
  db: DbExecutor,
  rows: Array<{
    url: string;
    kind: ImageKind;
    label: string | null;
    width: number | null;
    height: number | null;
    source: "heuristic" | "model";
    model: string | null;
  }>,
  now: Date,
): Promise<void> {
  if (rows.length === 0) return;
  const unique = [...new Map(rows.map((row) => [row.url, row])).values()];
  await db
    .insert(schema.imageAssets)
    .values(unique.map((row) => ({ ...row, createdAt: now, updatedAt: now })))
    .onConflictDoUpdate({
      target: schema.imageAssets.url,
      set: {
        kind: sql`excluded.kind`,
        label: sql`excluded.label`,
        width: sql`coalesce(excluded.width, ${schema.imageAssets.width})`,
        height: sql`coalesce(excluded.height, ${schema.imageAssets.height})`,
        source: sql`excluded.source`,
        model: sql`excluded.model`,
        updatedAt: now,
      },
      setWhere: sql`${schema.imageAssets.source} <> 'manual'`,
    });
}

/**
 * Puts a product with data problems in the supplier sync's review queue (one open entry per product, kept
 * up to date), or closes its entry when the problems are gone. Products not linked to a supplier are listed
 * on the enrichment page only.
 */
export async function syncReviewFlag(
  db: DbExecutor,
  product: Pick<EnrichProduct, "id" | "supplierId" | "supplierProductId">,
  problems: string[],
  now: Date,
): Promise<void> {
  if (!product.supplierId || !product.supplierProductId) return;
  const open = and(
    eq(schema.syncChanges.productId, product.id),
    eq(schema.syncChanges.type, "enrichment_flagged"),
    eq(schema.syncChanges.status, "pending"),
  );
  const [existing] = await db.select({ id: schema.syncChanges.id }).from(schema.syncChanges).where(open).limit(1);
  if (problems.length === 0) {
    if (existing) {
      await db
        .update(schema.syncChanges)
        .set({ status: "dismissed", resolvedAt: now, updatedAt: now })
        .where(eq(schema.syncChanges.id, existing.id));
    }
    return;
  }
  if (existing) {
    await db
      .update(schema.syncChanges)
      .set({ newValue: { problems }, updatedAt: now })
      .where(eq(schema.syncChanges.id, existing.id));
    return;
  }
  await db.insert(schema.syncChanges).values({
    supplierId: product.supplierId,
    supplierProductId: product.supplierProductId,
    productId: product.id,
    type: "enrichment_flagged",
    newValue: { problems },
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * The proposal awaiting approval: its hash covers what an admin would publish. A product approved before
 * whose proposal changed (the supplier changed its text, so the pipeline ran again) waits again.
 */
export function proposalHash(stages: Partial<Record<Stage, StageRow>>): string {
  return hashOf({
    extract: stages.extract?.inputsHash ?? null,
    validate: stages.validate?.output ?? null,
    classify: stages.classify?.output ?? null,
    rewrite: stages.rewrite?.output ?? null,
  });
}

export async function markPending(db: DbExecutor, productId: string, hash: string, now: Date): Promise<boolean> {
  const [current] = await db
    .select()
    .from(schema.productEnrichments)
    .where(and(eq(schema.productEnrichments.productId, productId), eq(schema.productEnrichments.stage, "publish")))
    .limit(1);
  if (current && current.inputsHash === hash) return false;
  await db
    .insert(schema.productEnrichments)
    .values({
      productId,
      stage: "publish",
      status: "pending",
      inputsHash: hash,
      output: current?.status === "approved" ? { previouslyApprovedAt: current.reviewedAt } : null,
      errors: [],
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [schema.productEnrichments.productId, schema.productEnrichments.stage],
      set: {
        status: "pending",
        inputsHash: hash,
        output: current?.status === "approved" ? { previouslyApprovedAt: current.reviewedAt } : null,
        errors: [],
        updatedAt: now,
      },
    });
  return true;
}

/** Marks every stage of these products stale, so the next run does them again. */
export async function requestRerun(db: DbExecutor, productIds: string[], now: Date): Promise<void> {
  if (productIds.length === 0) return;
  await db
    .update(schema.productEnrichments)
    .set({ inputsHash: "rerun", attempts: 0, updatedAt: now })
    .where(
      and(
        inArray(schema.productEnrichments.productId, productIds),
        inArray(schema.productEnrichments.stage, ["extract", "validate", "classify", "rewrite"]),
      ),
    );
}
