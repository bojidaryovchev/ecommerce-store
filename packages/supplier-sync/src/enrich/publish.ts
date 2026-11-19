import * as schema from "@ecommerce/database/schema";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import { addLocks, type LockableProductField } from "../locks";
import type { Database, DbExecutor } from "../types";
import { SPEC_FIELDS, formatSpecValue, isSpecKey, type SpecField, type SpecKey } from "./fields";
import { readClassify, readExtract, readRewrite, readValidate } from "./outputs";
import type { Stage, StageRow } from "./state";
import { proposalHash } from "./store";
import { normalizeSpecValue } from "./validate";

/**
 * The last gate: an admin approves what the pipeline proposes, in part or whole, and it goes live.
 *
 * Approved fields are locked, so the supplier sync stops overwriting them and reports the supplier's later
 * changes to them in the review queue instead: the copy locks the name and description, the specifications
 * lock the attributes, a new category locks the category.
 */

export class EnrichmentReviewError extends Error {}

export interface ApproveRequest {
  productId: string;
  userId: string | null;
  parts: { copy: boolean; specs: boolean; category: boolean };
  /** The admin's corrections, from the review form. */
  edits?: {
    name?: string;
    metaDescription?: string;
    description?: string;
    /** One entry per proposed spec: whether to publish it, and its value as typed. */
    specs?: Array<{ key: string; value: string; include: boolean }>;
  };
}

async function stagesOf(tx: DbExecutor, productId: string): Promise<Partial<Record<Stage, StageRow>>> {
  const rows = await tx
    .select()
    .from(schema.productEnrichments)
    .where(eq(schema.productEnrichments.productId, productId));
  return Object.fromEntries(rows.map((row) => [row.stage, row]));
}

/** Our attribute for each field, created or brought in line with the field's name, unit and order. */
async function ensureAttributes(tx: DbExecutor, keys: SpecKey[], now: Date): Promise<Map<SpecKey, string>> {
  const ids = new Map<SpecKey, string>();
  for (const key of keys) {
    const field: SpecField = SPEC_FIELDS[key];
    const [row] = await tx
      .insert(schema.attributes)
      .values({
        slug: field.attribute,
        name: field.name,
        unit: field.unit,
        filterable: field.filterable,
        sortOrder: field.sortOrder,
      })
      .onConflictDoUpdate({
        target: schema.attributes.slug,
        set: {
          name: field.name,
          unit: field.unit,
          filterable: field.filterable,
          sortOrder: field.sortOrder,
          updatedAt: now,
        },
      })
      .returning({ id: schema.attributes.id });
    if (!row) throw new Error(`Could not create the attribute ${field.attribute}`);
    ids.set(key, row.id);
  }
  return ids;
}

/** Publishes an approved proposal. Returns the product id, for revalidating its pages. */
export async function approveEnrichment(db: Database, request: ApproveRequest, now = new Date()): Promise<string> {
  return db.transaction(async (tx) => {
    const product = await tx.query.products.findFirst({
      where: eq(schema.products.id, request.productId),
      columns: { id: true, lockedFields: true, metadata: true, categoryId: true },
    });
    if (!product) throw new EnrichmentReviewError("Product not found");
    const stages = await stagesOf(tx, product.id);
    const extract = readExtract(stages.extract?.output);
    const validate = readValidate(stages.validate?.output);
    const classify = readClassify(stages.classify?.output);
    const rewrite = readRewrite(stages.rewrite?.output);

    const patch: Partial<typeof schema.products.$inferInsert> = { updatedAt: now };
    const locks: LockableProductField[] = [];
    const metadata: Record<string, string> = { ...product.metadata };

    if (request.parts.copy) {
      if (!rewrite) throw new EnrichmentReviewError("There is no rewritten copy to publish");
      const name = (request.edits?.name ?? rewrite.name).trim();
      const description = (request.edits?.description ?? rewrite.description).trim();
      const metaDescription = (request.edits?.metaDescription ?? rewrite.metaDescription).replace(/\s+/g, " ").trim();
      if (name.length < 4 || description.length < 50 || metaDescription.length < 30) {
        throw new EnrichmentReviewError("The name, description or meta description is too short");
      }
      patch.name = name;
      patch.description = description;
      metadata.metaDescription = metaDescription;
      metadata.descriptionRewrittenAt = now.toISOString();
      if (stages.rewrite?.model) metadata.descriptionRewriteModel = stages.rewrite.model;
      locks.push("name", "description");
    }

    if (request.parts.specs) {
      if (!validate) throw new EnrichmentReviewError("There are no validated specifications to publish");
      const edits = new Map((request.edits?.specs ?? []).map((edit) => [edit.key, edit]));
      const rows: Array<{ key: SpecKey; text: string; numeric: number | null }> = [];
      for (const spec of validate.specs) {
        // An admin's own value is shown by its manual row already (saveAdminFacts).
        if (spec.source === "admin") continue;
        const edit = edits.get(spec.key);
        if (edit && !edit.include) continue;
        if (edit && edit.value.trim() !== spec.text) {
          const normalized = normalizeSpecValue(spec.key, edit.value);
          if (!normalized.ok) {
            throw new EnrichmentReviewError(`${SPEC_FIELDS[spec.key].name}: ${normalized.reason}`);
          }
          rows.push({
            key: spec.key,
            text: formatSpecValue(spec.key, normalized.value),
            numeric: typeof normalized.value === "number" ? normalized.value : null,
          });
          continue;
        }
        rows.push({ key: spec.key, text: spec.text, numeric: spec.numeric });
      }
      const attributeIds = await ensureAttributes(
        tx,
        rows.map((row) => row.key),
        now,
      );
      // Supplier values the published specs replace: their own attributes and the ones they supersede.
      const replacedSlugs = new Set<string>(validate.supersede);
      for (const row of rows) {
        replacedSlugs.add(SPEC_FIELDS[row.key].attribute);
        for (const slug of (SPEC_FIELDS[row.key] as SpecField).supersedes ?? []) replacedSlugs.add(slug);
      }
      const replaced = replacedSlugs.size
        ? await tx
            .select({ id: schema.attributes.id })
            .from(schema.attributes)
            .where(inArray(schema.attributes.slug, [...replacedSlugs]))
        : [];
      await tx.delete(schema.productAttributeValues).where(
        and(
          eq(schema.productAttributeValues.productId, product.id),
          or(
            eq(schema.productAttributeValues.source, "enrichment"),
            replaced.length > 0
              ? and(
                  eq(schema.productAttributeValues.source, "supplier"),
                  inArray(
                    schema.productAttributeValues.attributeId,
                    replaced.map((row) => row.id),
                  ),
                )
              : sql`false`,
          ),
        ),
      );
      if (rows.length > 0) {
        await tx
          .insert(schema.productAttributeValues)
          .values(
            rows.map((row) => ({
              productId: product.id,
              attributeId: attributeIds.get(row.key)!,
              value: row.text,
              numericValue: row.numeric,
              source: "enrichment" as const,
              sortOrder: 0,
            })),
          )
          .onConflictDoNothing();
      }
      if (validate.gtin) metadata.gtin = validate.gtin;
      if (validate.mpn) metadata.mpn = validate.mpn;
      if (extract && extract.features.length > 0) {
        patch.marketingFeatures = extract.features.slice(0, 6).map((name) => ({ name }));
      }
      locks.push("attributes");
    }

    if (request.parts.category && classify?.category) {
      const [category] = await tx
        .select({ id: schema.categories.id })
        .from(schema.categories)
        .where(eq(schema.categories.slug, classify.category.slug))
        .limit(1);
      if (!category) throw new EnrichmentReviewError(`Category ${classify.category.slug} no longer exists`);
      if (category.id !== product.categoryId) {
        patch.categoryId = category.id;
        locks.push("categoryId");
      }
    }

    patch.metadata = metadata;
    patch.lockedFields = addLocks(product.lockedFields, locks);
    await tx.update(schema.products).set(patch).where(eq(schema.products.id, product.id));

    const review = {
      status: "approved" as const,
      inputsHash: proposalHash(stages),
      output: { parts: request.parts, edited: Boolean(request.edits) },
      errors: [],
      reviewedBy: request.userId,
      reviewedAt: now,
      updatedAt: now,
    };
    await tx
      .insert(schema.productEnrichments)
      .values({ productId: product.id, stage: "publish", createdAt: now, ...review })
      .onConflictDoUpdate({
        target: [schema.productEnrichments.productId, schema.productEnrichments.stage],
        set: review,
      });

    await tx
      .update(schema.syncChanges)
      .set({ status: "applied", resolvedBy: request.userId, resolvedAt: now, updatedAt: now })
      .where(
        and(
          eq(schema.syncChanges.productId, product.id),
          eq(schema.syncChanges.type, "enrichment_flagged"),
          eq(schema.syncChanges.status, "pending"),
        ),
      );
    return product.id;
  });
}

/** Turns a proposal down: nothing is published; the product is asked about again only when its inputs change. */
export interface AdminFactsResult {
  saved: SpecKey[];
  cleared: SpecKey[];
  errors: Array<{ key: string; message: string }>;
}

/**
 * An admin fills in or corrects characteristics (the ones the research could not find or that are contested).
 * Each value is checked like any other (type, unit), stored as a manual attribute value the sync never touches,
 * and replaces the supplier's value of the same field; the product's attributes are locked so a sync does not put
 * the supplier's figure back. An empty value removes the admin's value. The next enrichment run reads these as
 * facts (validate.ts), so the copy is rewritten with them and reviewed before it is published.
 */
export async function saveAdminFacts(
  db: Database,
  productId: string,
  facts: ReadonlyArray<{ key: string; value: string }>,
  now = new Date(),
): Promise<AdminFactsResult> {
  const result: AdminFactsResult = { saved: [], cleared: [], errors: [] };
  const valid: Array<{ key: SpecKey; text: string; numeric: number | null }> = [];
  for (const fact of facts) {
    if (!isSpecKey(fact.key)) {
      result.errors.push({ key: fact.key, message: "Unknown characteristic" });
      continue;
    }
    const value = fact.value.trim();
    if (value === "") {
      result.cleared.push(fact.key);
      continue;
    }
    const normalized = normalizeSpecValue(fact.key, value);
    if (!normalized.ok) {
      result.errors.push({ key: fact.key, message: normalized.reason });
      continue;
    }
    valid.push({
      key: fact.key,
      text: formatSpecValue(fact.key, normalized.value),
      numeric: typeof normalized.value === "number" ? normalized.value : null,
    });
  }
  if (result.errors.length > 0) return result;

  await db.transaction(async (tx) => {
    const product = await tx.query.products.findFirst({
      where: eq(schema.products.id, productId),
      columns: { id: true, lockedFields: true },
    });
    if (!product) throw new EnrichmentReviewError("Product not found");
    const keys = [...valid.map((fact) => fact.key), ...result.cleared];
    const attributeIds = await ensureAttributes(tx, keys, now);
    // The supplier's value of the same figure goes too: the admin's value stands for it.
    const slugs = keys.flatMap((key) => [
      SPEC_FIELDS[key].attribute,
      ...((SPEC_FIELDS[key] as SpecField).supersedes ?? []),
    ]);
    const replaced = await tx
      .select({ id: schema.attributes.id })
      .from(schema.attributes)
      .where(inArray(schema.attributes.slug, slugs));
    await tx.delete(schema.productAttributeValues).where(
      and(
        eq(schema.productAttributeValues.productId, productId),
        inArray(
          schema.productAttributeValues.attributeId,
          replaced.map((row) => row.id),
        ),
        inArray(schema.productAttributeValues.source, ["manual", "supplier"]),
      ),
    );
    if (valid.length > 0) {
      await tx.insert(schema.productAttributeValues).values(
        valid.map((fact) => ({
          productId,
          attributeId: attributeIds.get(fact.key)!,
          value: fact.text,
          numericValue: fact.numeric,
          source: "manual" as const,
          sortOrder: 0,
        })),
      );
    }
    await tx
      .update(schema.products)
      .set({ lockedFields: addLocks(product.lockedFields, ["attributes"]), updatedAt: now })
      .where(eq(schema.products.id, productId));
  });
  result.saved = valid.map((fact) => fact.key);
  return result;
}

export async function rejectEnrichment(db: Database, productId: string, userId: string | null, now = new Date()) {
  await db.transaction(async (tx) => {
    const stages = await stagesOf(tx, productId);
    const review = {
      status: "rejected" as const,
      inputsHash: proposalHash(stages),
      output: null,
      errors: [],
      reviewedBy: userId,
      reviewedAt: now,
      updatedAt: now,
    };
    await tx
      .insert(schema.productEnrichments)
      .values({ productId, stage: "publish", createdAt: now, ...review })
      .onConflictDoUpdate({
        target: [schema.productEnrichments.productId, schema.productEnrichments.stage],
        set: review,
      });
    await tx
      .update(schema.syncChanges)
      .set({ status: "dismissed", resolvedBy: userId, resolvedAt: now, updatedAt: now })
      .where(
        and(
          eq(schema.syncChanges.productId, productId),
          eq(schema.syncChanges.type, "enrichment_flagged"),
          eq(schema.syncChanges.status, "pending"),
        ),
      );
  });
}

/**
 * Approves every proposal that is ready: waiting for approval, with copy that passed its gate and the second
 * reader (the review stage). A product the data checks held goes out without its figures in doubt; one the
 * reviewer held, or whose copy was sent back for good, is left for a person.
 */
export async function approveAllReady(db: Database, userId: string | null, now = new Date()): Promise<string[]> {
  const rows = await db
    .select({ productId: schema.productEnrichments.productId })
    .from(schema.productEnrichments)
    .where(and(eq(schema.productEnrichments.stage, "publish"), eq(schema.productEnrichments.status, "pending")));
  const ids = rows.map((row) => row.productId);
  if (ids.length === 0) return [];
  const gates = await db
    .select({
      productId: schema.productEnrichments.productId,
      stage: schema.productEnrichments.stage,
      status: schema.productEnrichments.status,
      output: schema.productEnrichments.output,
    })
    .from(schema.productEnrichments)
    .where(
      and(
        inArray(schema.productEnrichments.productId, ids),
        inArray(schema.productEnrichments.stage, ["validate", "classify", "rewrite", "review"]),
      ),
    );
  const approved: string[] = [];
  for (const productId of ids) {
    const own = (stage: string) => gates.find((gate) => gate.productId === productId && gate.stage === stage);
    // Ready: the copy passed its gate and the second reader, and nothing failed on the way.
    const ready =
      own("rewrite")?.status === "succeeded" &&
      own("review")?.status === "succeeded" &&
      own("validate") !== undefined &&
      own("classify")?.status !== "failed" &&
      own("validate")?.status !== "failed";
    if (!ready) continue;
    // A product the data checks held is published without the figures in doubt (the copy leaves them out too),
    // so neither the supplier's contested value nor ours shows until a person settles it.
    const omit = readValidate(own("validate")?.output)?.omit ?? [];
    approved.push(
      await approveEnrichment(
        db,
        {
          productId,
          userId,
          parts: { copy: true, specs: true, category: true },
          ...(omit.length > 0 && { edits: { specs: omit.map((key) => ({ key, include: false, value: "" })) } }),
        },
        now,
      ),
    );
  }
  return approved;
}
