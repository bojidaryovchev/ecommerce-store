"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { revalidateCatalog } from "@/lib/supplier-sync";
import { characteristicsSchema, type CharacteristicsInput } from "@/schemas/characteristics.schema";
import { enrichmentReviewSchema, type EnrichmentReviewInput } from "@/schemas/enrichment-review.schema";
import type { ActionResult } from "@/types/action-result.type";
import { db, schema } from "@ecommerce/database";
import {
  EnrichmentReviewError,
  SPEC_FIELDS,
  approveAllReady,
  approveEnrichment,
  isSpecKey,
  rejectEnrichment,
  requestRerun,
  saveAdminFacts,
} from "@ecommerce/supplier-sync/enrich";
import { eq } from "drizzle-orm";
import { z } from "zod";

const failure = (error: unknown, fallback: string): ActionResult<never> => {
  if (!(error instanceof EnrichmentReviewError)) console.error(fallback, error);
  return {
    success: false,
    error: error instanceof EnrichmentReviewError || error instanceof Error ? error.message : fallback,
  };
};

/** Publishes the approved parts of a product's proposal, with the admin's corrections; locks what it publishes. */
async function approveEnrichmentAction(productId: string, input: EnrichmentReviewInput): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const parsed = enrichmentReviewSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: z.prettifyError(parsed.error) };
    const { parts, name, metaDescription, description, specs } = parsed.data;
    await approveEnrichment(db, {
      productId,
      userId: session?.user?.id ?? null,
      parts,
      edits: {
        ...(parts.copy ? { name, metaDescription, description } : {}),
        specs: specs.map(({ key, value, include }) => ({ key, value, include })),
      },
    });
    revalidateCatalog([productId], { immediate: true, categoriesChanged: parts.category });
    return { success: true, data: undefined };
  } catch (error) {
    return failure(error, "Could not publish the proposal");
  }
}

/** Turns a proposal down; it is asked about again only when the supplier changes the product. */
async function rejectEnrichmentAction(productId: string): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    await rejectEnrichment(db, productId, session?.user?.id ?? null);
    revalidateCatalog([], { immediate: true });
    return { success: true, data: undefined };
  } catch (error) {
    return failure(error, "Could not reject the proposal");
  }
}

/** Marks a product to go through the whole pipeline again on the next run. */
async function rerunEnrichmentAction(productId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await requestRerun(db, [productId], new Date());
    return { success: true, data: undefined };
  } catch (error) {
    return failure(error, "Could not ask for a re-run");
  }
}

/** Publishes every clean proposal at once (flagged ones stay for a person). */
async function approveAllReadyAction(): Promise<ActionResult<{ count: number }>> {
  try {
    const session = await requireAdmin();
    const ids = await approveAllReady(db, session?.user?.id ?? null);
    revalidateCatalog(ids, { immediate: true, categoriesChanged: ids.length > 0 });
    return { success: true, data: { count: ids.length } };
  } catch (error) {
    return failure(error, "Could not publish the ready proposals");
  }
}

/**
 * Fills in or corrects characteristics the research could not find or that are contested. They show in the shop
 * at once; the next enrichment run writes them into the copy and the reviewer checks it before it is published.
 */
async function saveCharacteristicsAction(
  productId: string,
  input: CharacteristicsInput,
): Promise<ActionResult<{ saved: number; cleared: number }>> {
  try {
    await requireAdmin();
    const parsed = characteristicsSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: z.prettifyError(parsed.error) };
    const result = await saveAdminFacts(db, productId, parsed.data.values);
    if (result.errors.length > 0) {
      const name = (key: string) => (isSpecKey(key) ? SPEC_FIELDS[key].name : key);
      return {
        success: false,
        error: result.errors.map((entry) => `${name(entry.key)}: ${entry.message}`).join("; "),
      };
    }
    revalidateCatalog([productId], { immediate: true });
    return { success: true, data: { saved: result.saved.length, cleared: result.cleared.length } };
  } catch (error) {
    return failure(error, "Could not save the characteristics");
  }
}

/**
 * Takes a product out of the shop, or puts it back. Hidden: not listed, not sold, not indexed, and its page says
 * it is unavailable. The supplier sync leaves this alone.
 */
async function setProductVisibilityAction(productId: string, visible: boolean): Promise<ActionResult> {
  try {
    await requireAdmin();
    const [row] = await db
      .update(schema.products)
      .set({ active: visible, updatedAt: new Date() })
      .where(eq(schema.products.id, productId))
      .returning({ id: schema.products.id });
    if (!row) return { success: false, error: "Product not found" };
    revalidateCatalog([productId], { immediate: true, categoriesChanged: true });
    return { success: true, data: undefined };
  } catch (error) {
    return failure(error, "Could not change whether the product is shown");
  }
}

export {
  approveAllReadyAction,
  approveEnrichmentAction,
  rejectEnrichmentAction,
  rerunEnrichmentAction,
  saveCharacteristicsAction,
  setProductVisibilityAction,
};
