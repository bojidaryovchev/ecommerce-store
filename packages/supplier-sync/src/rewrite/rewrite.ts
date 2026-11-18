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
  name: z
    .string()
    .describe("The product name in Bulgarian, starting with the kind of product, then brand and model as given"),
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
- Write what a buyer of this kind of unit needs to know, in this order: what it is and which home or room it suits (sizing from the shop's notes below, applied to the given specifications); its main features and what each means in use, as short paragraphs or a list (one item per line, starting with "• "); what installing it involves, from the shop's notes; and which of the shop's guides or calculators helps choose, named in words. For units the shop installs (heat pumps, air conditioners, pellet stoves and boilers, underfloor heating), say the shop can survey the home and install it; promise nothing more specific.
- Plain text, a blank line between paragraphs. No headings, no markdown, no links or URLs, no emoji, no exclamation marks, no superlatives such as "най-добрият".
- Natural, precise Bulgarian, addressing the reader politely ("вие"). Keep model names, units and numbers exactly as given.
- As long as the facts and the shop's notes need, and no longer: no filler and no repetition.
- name: the kind of product first, then brand and model exactly as given ("Пелетна камина Artel Easy S8", "Термопомпа въздух-вода Artel R32 Mono 5 kW"), in normal capitalisation, never all capitals.
- metaDescription: one sentence naming the product type, the brand and its main specification.`;

/**
 * What the shop itself knows about each section of the catalogue, from its guides, calculators and
 * installation pages: what makes a description more than the supplier's text reworded.
 */
const SECTION_NOTES: Record<string, string> = {
  termopompi:
    'Sizing: by the home\'s heat loss, roughly 35 W/m² for a new well-insulated house, 60 W/m² for an insulated older one, 100 W/m² without insulation, about 20% more in the mountains, plus about 0.25 kW per person for hot water. Installing: an outdoor unit on a wall bracket or stand with free airflow, connected to radiators or underfloor heating; monoblock units carry the hydraulics outside, split units have an indoor hydraulic module; a separate electrical supply. Guides: "Каква термопомпа ми трябва?" and the heat pump power calculator.',
  klimatitsi:
    'Sizing: about 100 W/m² at a 2.6 m ceiling, more for sunny rooms, top floors and kitchens; 9,000 BTU suits roughly 20–25 m², 12,000 BTU 25–35 m². Installing: indoor and outdoor unit, the refrigerant line between them, a condensate drain and its own electrical line; inverter units heat efficiently too. Guides: "Колко BTU климатик ми трябва?" and the air conditioner calculator.',
  "peletni-kamini":
    'Choosing: a dry stove heats the room it stands in; a stove with a water jacket also feeds the radiators; a boiler sits in a utility room. Installing: a chimney of the right section and draught, or an insulated steel flue; for water jackets an expansion vessel, a pump and safety devices. Guide: "Пелетна камина или пелетен котел?".',
  kotli:
    'Choosing: a boiler heats the whole house through the radiators from a utility room; pellet boilers feed automatically from a hopper. Installing: a chimney of the right section and draught, connection to the heating circuit with pump, expansion vessel and safety devices. Guide: "Пелетна камина или пелетен котел?".',
  "radiatori-i-konvektori":
    'Sizing: a room needs roughly 60 W/m² when well insulated, 80 average, 100 poor; with low-temperature water (heat pumps) a radiator gives about half its catalogue output, so it must be larger. Guide: "Как да изберем радиатор" and the radiator calculator.',
  "liri-za-banya":
    "Choosing: by the heat the bathroom needs and the centre distance of the pipes; electric versions need no connection to the heating.",
  "podovo-otoplenie":
    'Underfloor heating works with low water temperatures, which suits heat pumps; it needs a manifold, pipe loops and insulation under the screed, laid before the floor is finished. Guide: "Подово отопление: как работи и кога си струва".',
  "solarni-sistemi":
    "Solar water heaters take a large part of the hot water in summer; they need a sunny roof or wall facing south.",
  "pompi-i-trabi":
    "Pumps and pipes for building and maintaining heating systems; a circulation pump is sized by the system's flow and head.",
  "industrialno-otoplenie": "Heating for workshops, warehouses and large rooms, sized by volume and heat loss on site.",
};

export type ProductForRewrite = {
  id: string;
  name: string;
  brand: string | null;
  description: string;
  category: string | null;
  /** The top-level section's slug, for the shop's notes. */
  section: string | null;
  specs: Array<{ name: string; value: string }>;
};

export function rewritePrompt(product: ProductForRewrite): string {
  const specs = product.specs.map((spec) => `- ${spec.name}: ${spec.value}`).join("\n") || "(none)";
  return [
    `Name: ${product.name}`,
    `Brand: ${product.brand ?? "(none)"}`,
    `Category: ${product.category ?? "(none)"}`,
    `Specifications:\n${specs}`,
    `The shop's notes for this section:\n${(product.section && SECTION_NOTES[product.section]) || "(none)"}`,
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
  return { name: copy.name.trim(), description: copy.description.trim(), metaDescription: copy.metaDescription.trim() };
}

/** What makes a rewrite unusable: too short, or a long run of words taken over from the supplier. */
export function checkCopy(copy: RewrittenCopy, product: Pick<ProductForRewrite, "description">): string | null {
  if (copy.description.trim().length < 200) return "description too short";
  if (copy.metaDescription.trim().length < 50) return "meta description too short";
  if (copy.name.trim().length < 4) return "no name";
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
  const categories = await db.query.categories.findMany({ columns: { id: true, slug: true, parentId: true } });
  const byId = new Map(categories.map((category) => [category.id, category]));
  const sectionOf = (id: string | null) => {
    let node = id ? byId.get(id) : undefined;
    for (let depth = 0; node?.parentId && depth < 10; depth++) node = byId.get(node.parentId);
    return node?.slug ?? null;
  };
  const wanted = options.categorySlug ? rows.filter((row) => row.category?.slug === options.categorySlug) : rows;
  return wanted.slice(0, options.limit ?? wanted.length).map((row) => ({
    id: row.id,
    name: row.name,
    brand: row.brand,
    description: row.description!,
    category: row.category?.name ?? null,
    section: sectionOf(row.category?.id ?? null),
    specs: row.attributeValues.map((value) => ({ name: value.attribute.name, value: value.value })),
  }));
}

/** Store a rewrite: the name, the description, its meta description, and the locks that keep them. */
export async function saveRewrite(db: Database, productId: string, copy: RewrittenCopy): Promise<void> {
  const product = await db.query.products.findFirst({
    where: eq(schema.products.id, productId),
    columns: { lockedFields: true, metadata: true },
  });
  if (!product) return;
  await db
    .update(schema.products)
    .set({
      name: copy.name,
      description: copy.description,
      lockedFields: addLocks(product.lockedFields, ["name", "description"]),
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
