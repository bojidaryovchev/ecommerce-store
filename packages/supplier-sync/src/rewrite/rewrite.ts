import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as schema from "@ecommerce/database/schema";
import { and, asc, eq, isNotNull, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { z } from "zod";
import { addLocks } from "../locks";

/**
 * Rewrites the supplier's product descriptions into the shop's own Bulgarian copy, one product per
 * request to Claude, with structured output. A rewritten description gets the "description" lock, so
 * the supplier sync stops overwriting it (and reports supplier changes to it for review instead); the
 * lock is also how a later run knows the product is done. Nothing is invented: the model may use only
 * the facts it is given.
 */
type Database = PostgresJsDatabase<typeof schema>;

export const REWRITE_MODEL = "claude-opus-5-5";

const Copy = z.object({
  description: z
    .string()
    .describe("The product description in Bulgarian, plain text, paragraphs separated by a blank line"),
  metaDescription: z.string().describe("One Bulgarian sentence for search results, about 140-155 characters"),
});
export type RewrittenCopy = z.infer<typeof Copy>;

/** Stable across every request, so it is cached after the first. */
const SYSTEM = `You write product copy for a Bulgarian online shop that sells heating and cooling units (heat pumps, air conditioners, pellet stoves and boilers, radiators and convectors, towel rails, underfloor heating, pumps and pipes, solar systems) and installs them turnkey.

You receive one product: its name, brand, category, specifications and the supplier's description. Write the shop's own description of it, in Bulgarian, for the product page.

Rules:
- Original wording: do not copy sentences or distinctive phrases from the supplier's text. Keep the facts, use your own words and your own order.
- Use only facts given in the input. Never invent specifications, certifications, energy classes, warranty terms, prices, delivery times or stock. When the name and the specifications disagree about a figure (for example a power rating), leave that figure out.
- Leave out everything that belongs to the supplier: their company name, phone numbers, addresses, links, and calls to fill in their forms or ask them for an offer. Test-condition footnotes become at most one short sentence.
- Start with 2-3 sentences on what the product is and whom it suits. Then the main features and what each means for the buyer, as short paragraphs or a list (one item per line, starting with "• "). For units the shop installs (heat pumps, air conditioners, pellet stoves and boilers, underfloor heating), end with one sentence that the shop can survey the home and install it; promise nothing more specific.
- Plain text, a blank line between paragraphs. No headings, no markdown, no emoji, no exclamation marks, no superlatives such as "най-добрият".
- Natural, precise Bulgarian, addressing the reader politely ("вие"). Keep model names, units and numbers exactly as given.
- About 120-260 words: shorter for simple accessories, longer for complex units.
- metaDescription: one sentence of about 140-155 characters naming the product type, the brand and its main specification.`;

export type ProductForRewrite = {
  id: string;
  name: string;
  brand: string | null;
  description: string;
  category: string | null;
  specs: Array<{ name: string; value: string }>;
};

export function rewritePrompt(product: ProductForRewrite): string {
  const specs = product.specs.map((spec) => `- ${spec.name}: ${spec.value}`).join("\n") || "(none)";
  return [
    `Name: ${product.name}`,
    `Brand: ${product.brand ?? "(none)"}`,
    `Category: ${product.category ?? "(none)"}`,
    `Specifications:\n${specs}`,
    `Supplier's description:\n<<<\n${product.description}\n>>>`,
  ].join("\n\n");
}

export async function rewriteOne(client: Anthropic, product: ProductForRewrite): Promise<RewrittenCopy> {
  const response = await client.beta.messages.parse({
    model: REWRITE_MODEL,
    max_tokens: 16000,
    // If a safety classifier declines, the API retries on a fallback model it picks by category.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(Copy) },
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: rewritePrompt(product) }],
  });
  if (response.stop_reason === "refusal") throw new Error("declined (refusal)");
  if (response.stop_reason === "max_tokens") throw new Error("cut off at max_tokens");
  const copy = response.parsed_output;
  if (!copy) throw new Error("no structured output");
  const problem = checkCopy(copy, product);
  if (problem) throw new Error(problem);
  return { description: copy.description.trim(), metaDescription: copy.metaDescription.trim() };
}

/** What makes a rewrite unusable: too short, or a long run of words taken over from the supplier. */
export function checkCopy(copy: RewrittenCopy, product: Pick<ProductForRewrite, "description">): string | null {
  if (copy.description.trim().length < 200) return "description too short";
  if (copy.metaDescription.trim().length < 50) return "meta description too short";
  const words = (text: string) => text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  const source = words(product.description);
  const shingles = new Set<string>();
  for (let i = 0; i + 8 <= source.length; i++) shingles.add(source.slice(i, i + 8).join(" "));
  const written = words(copy.description);
  for (let i = 0; i + 8 <= written.length; i++) {
    if (shingles.has(written.slice(i, i + 8).join(" "))) return "copies an 8-word run from the supplier text";
  }
  return null;
}

/** Products whose description is still the supplier's: not locked (rewritten or edited by hand). */
export async function productsToRewrite(
  db: Database,
  options: { limit?: number; categorySlug?: string; ids?: string[] } = {},
): Promise<ProductForRewrite[]> {
  const rows = await db.query.products.findMany({
    where: and(
      isNotNull(schema.products.description),
      sql`not ('description' = any(${schema.products.lockedFields}))`,
      options.ids ? sql`${schema.products.id} in ${options.ids}` : undefined,
    ),
    with: {
      category: true,
      attributeValues: { orderBy: [asc(schema.productAttributeValues.sortOrder)], with: { attribute: true } },
    },
    orderBy: [asc(schema.products.createdAt)],
  });
  const wanted = options.categorySlug ? rows.filter((row) => row.category?.slug === options.categorySlug) : rows;
  return wanted.slice(0, options.limit ?? wanted.length).map((row) => ({
    id: row.id,
    name: row.name,
    brand: row.brand,
    description: row.description!,
    category: row.category?.name ?? null,
    specs: row.attributeValues.map((value) => ({ name: value.attribute.name, value: value.value })),
  }));
}

/** Store a rewrite: the new description, its meta description, and the lock that keeps both. */
export async function saveRewrite(db: Database, productId: string, copy: RewrittenCopy): Promise<void> {
  const product = await db.query.products.findFirst({
    where: eq(schema.products.id, productId),
    columns: { lockedFields: true, metadata: true },
  });
  if (!product) return;
  await db
    .update(schema.products)
    .set({
      description: copy.description,
      lockedFields: addLocks(product.lockedFields, ["description"]),
      metadata: {
        ...product.metadata,
        metaDescription: copy.metaDescription,
        descriptionRewrittenAt: new Date().toISOString(),
        descriptionRewriteModel: REWRITE_MODEL,
      },
      updatedAt: new Date(),
    })
    .where(eq(schema.products.id, productId));
}
