"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { revalidateCatalog } from "@/lib/supplier-sync";
import { enrichmentReviewSchema, type EnrichmentReviewInput } from "@/schemas/enrichment-review.schema";
import type { ActionResult } from "@/types/action-result.type";
import { db } from "@ecommerce/database";
import {
  EnrichmentReviewError,
  approveAllReady,
  approveEnrichment,
  rejectEnrichment,
  requestRerun,
} from "@ecommerce/supplier-sync/enrich";
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

export { approveAllReadyAction, approveEnrichmentAction, rejectEnrichmentAction, rerunEnrichmentAction };
