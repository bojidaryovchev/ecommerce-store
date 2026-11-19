"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { categoryFaqSchema, type CategoryFaqInput } from "@/schemas/category-faq.schema";
import type { ActionResult } from "@/types/action-result.type";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";

/**
 * Saves the questions a category page shows, as the admin wrote them. They are the admin's from then on: the
 * pipeline (packages/supplier-sync/src/enrich/faq.ts) never rewrites them. No questions at all hides the section.
 */
async function saveCategoryFaqAction(categoryId: string, input: CategoryFaqInput): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = categoryFaqSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: z.prettifyError(parsed.error) };
    const values = {
      items: parsed.data.items,
      intro: parsed.data.intro || null,
      metaDescription: parsed.data.metaDescription || null,
      draft: null,
      status: "published" as const,
      notes: null,
      attempts: 0,
      source: "admin" as const,
      model: null,
    };
    await db
      .insert(schema.categoryFaqs)
      .values({ categoryId, ...values })
      .onConflictDoUpdate({ target: schema.categoryFaqs.categoryId, set: { ...values, updatedAt: new Date() } });
    updateTag(CACHE_TAGS.categoryFaq(categoryId));
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Could not save the questions", error);
    return { success: false, error: error instanceof Error ? error.message : "Could not save the questions" };
  }
}

/**
 * Gives a category's questions back to the pipeline: the next `enrich --faq` run writes them afresh and the second
 * reader checks them. Until then the page shows none.
 */
async function resetCategoryFaqAction(categoryId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await db.delete(schema.categoryFaqs).where(eq(schema.categoryFaqs.categoryId, categoryId));
    updateTag(CACHE_TAGS.categoryFaq(categoryId));
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Could not reset the questions", error);
    return { success: false, error: error instanceof Error ? error.message : "Could not reset the questions" };
  }
}

export { resetCategoryFaqAction, saveCategoryFaqAction };
