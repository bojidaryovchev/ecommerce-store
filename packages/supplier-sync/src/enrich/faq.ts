import type { CategoryFaqItem, CategoryFaqStatus } from "@ecommerce/database/schema";
import * as schema from "@ecommerce/database/schema";
import { eq, inArray, isNull, ne } from "drizzle-orm";
import { rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { Logger } from "../logger";
import type { Database } from "../types";
import { SessionError, scrubForLog, type SessionRequest, type SessionResult } from "./claude";
import {
  FAQ_OUTPUT_JSON_SCHEMA,
  FAQ_REVIEW_OUTPUT_JSON_SCHEMA,
  faqCategorySchema,
  faqReviewCategorySchema,
  type FaqAnswer,
  type FaqBatch,
  type FaqItem,
  type FaqReviewBatch,
} from "./contract";
import { SECTION_NOTES } from "./copy";
import { normalizePhrase, phraseCount } from "./keywords";
import { createWorkspace, type Generate } from "./run";
import { SEARCH_DEMAND } from "./search-demand";

/**
 * Questions and answers for the category pages, written and checked the way product copy is.
 *
 * A writer (the catalog-faq skill) answers what people in Bulgaria search for about each category, from what the
 * catalogue holds there (brands, the range of its specifications), the shop's rules of thumb for the section and
 * what it installs. Code checks the form (Bulgarian, plain text, no prices, contacts or links, no question the
 * parent page already answers); a second reader (catalog-faq-review, with the web to check general claims) passes
 * the draft, sends it back with notes or holds it. Only a passed draft is published; three drafts without a pass
 * leave the questions to the admin, and questions the admin edited are never touched again.
 */

/** Which searches belong to a category: phrases holding these words, in any inflection (keywords.ts). */
export const FAQ_TOPICS: Readonly<Record<string, readonly string[]>> = {
  termopompi: ["термопомпа"],
  monoblok: ["термопомпа моноблок", "термопомпа въздух вода"],
  split: ["термопомпа сплит", "термопомпа въздух вода"],
  klimatitsi: ["климатик"],
  "peletni-kamini": ["пелетна камина", "камина на пелети"],
  "s-vodna-riza": ["водна риза"],
  suhi: ["суха пелетна камина", "без водна риза"],
  kotli: ["котел"],
  "peletni-kotli": ["пелетен котел", "котел на пелети"],
  "radiatori-i-konvektori": ["радиатор", "конвектор"],
  "panelni-radiatori": ["панелен радиатор"],
  "aluminievi-radiatori": ["алуминиев радиатор"],
  "ventilatorni-konvektori": ["вентилаторен конвектор"],
  "liri-za-banya": ["лира за баня"],
  "aluminievi-liri": ["алуминиева лира"],
  "dizaynerski-liri": ["дизайнерска лира"],
  "elektricheski-liri": ["електрическа лира"],
  "aksesoari-za-liri": ["нагревател за лира", "кран за лира"],
  "podovo-otoplenie": ["подово отопление"],
  "pompi-i-trabi": ["циркулационна помпа", "помпа за парно"],
  "tsirkulatsionni-pompi": ["циркулационна помпа"],
};

/** A category with fewer live products than this gets no questions: there is too little to answer from. */
export const FAQ_MIN_PRODUCTS = 8;

/** A category without a description of its own gets an introduction and a meta description from this many on. */
export const FAQ_MIN_INTRO_PRODUCTS = 3;

const KEEP_QUESTIONS =
  "Keep these questions and answers as they are unless one of them is wrong; write the introduction and the meta description.";

/** What the shop installs, by top-level category (the web app's installation pages). */
const INSTALLATION: Readonly<Record<string, string>> = {
  termopompi:
    "The shop installs heat pumps turnkey with its own team: a site visit, a quote, installation and commissioning. Its page „Монтаж на термопомпа въздух-вода“ walks through the steps.",
  klimatitsi:
    "The shop installs air conditioners turnkey with its own team: a site visit, a quote, installation and commissioning. Its page „Монтаж на климатик“ walks through the steps.",
  "peletni-kamini":
    "The shop installs pellet heating turnkey with its own team (stoves, boilers and the radiator circuit): a site visit, a quote, installation and commissioning. Its page „Монтаж на пелетно отопление“ walks through the steps.",
  kotli:
    "The shop installs pellet heating turnkey with its own team (stoves, boilers and the radiator circuit): a site visit, a quote, installation and commissioning. Its page „Монтаж на пелетно отопление“ walks through the steps.",
  "radiatori-i-konvektori":
    "The shop installs radiators as part of the heating systems it installs turnkey (pellet heating, heat pumps): a site visit, a quote, installation and commissioning. Its page „Монтаж на пелетно отопление“ walks through the steps.",
  "podovo-otoplenie":
    "The shop installs underfloor heating turnkey with its own team: a site visit, a quote, laying the loops and the manifold, and commissioning. Its page „Монтаж на подово отопление“ walks through the steps.",
};

/** Searches that are not a buyer's question about the kind of product: other shops, towns, second-hand, laundry. */
const NOT_ABOUT_THE_KIND = new Set([
  "лидл",
  "практикер",
  "технополис",
  "техномаркет",
  "бриколаж",
  "джъмбо",
  "jumbo",
  "емаг",
  "emag",
  "olx",
  "икеа",
  "ikea",
  "com",
  "варна",
  "пловдив",
  "софия",
  "бургас",
  "русе",
  "плевен",
  "сливен",
  "добрич",
  "шумен",
  "хасково",
  "пазарджик",
  "благоевград",
  "сушилня",
  "сушилни",
  "пералня",
  "перални",
]);

const SEARCHES_PER_CATEGORY = 20;
const BATCH_SIZE = 4;
const MAX_ATTEMPTS = 3;

/** The searches for a category's topics, the most searched first. */
export function searchesFor(slug: string): Array<{ phrase: string; volume: number }> {
  const topics = FAQ_TOPICS[slug] ?? [];
  return Object.entries(SEARCH_DEMAND)
    .filter(([phrase]) => topics.some((topic) => phraseCount(phrase, topic) > 0))
    .filter(([phrase]) => !phrase.includes("втора ръка") && !phrase.split(" ").some((w) => NOT_ABOUT_THE_KIND.has(w)))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, SEARCHES_PER_CATEGORY)
    .map(([phrase, volume]) => ({ phrase, volume }));
}

/* --- What the catalogue holds ------------------------------------------------------------------------------ */

const NUMBER_WITH_UNIT = /^(\d+(?:[.,]\d+)?)\s*([^\d\s][^\d]*)?$/u;
const decimal = (value: number) => String(Math.round(value * 100) / 100).replace(".", ",");
const capitalised = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * The specifications most of a category's products have, summed up: the range of a figure ("4–16 kW") or the
 * values found with how many products have each. Only these figures about the products may be stated.
 */
export function summarizeSpecs(
  values: ReadonlyArray<{ productId: string; name: string; value: string }>,
  productCount: number,
): Array<{ name: string; summary: string }> {
  const byName = new Map<string, Map<string, Set<string>>>();
  for (const { productId, name, value } of values) {
    const key = capitalised(name.trim());
    const text = value.trim();
    if (!key || !text) continue;
    const perValue = byName.get(key) ?? new Map<string, Set<string>>();
    perValue.set(text, (perValue.get(text) ?? new Set()).add(productId));
    byName.set(key, perValue);
  }
  const needed = Math.max(2, Math.ceil(productCount * 0.4));
  const rows: Array<{ name: string; summary: string; coverage: number }> = [];
  for (const [name, perValue] of byName) {
    const products = new Set([...perValue.values()].flatMap((ids) => [...ids]));
    if (products.size < needed) continue;
    const have = `${products.size} of ${productCount} products`;
    const parsed = [...perValue.keys()].map((text) => {
      const match = NUMBER_WITH_UNIT.exec(text);
      return match ? { number: Number(match[1]!.replace(",", ".")), unit: (match[2] ?? "").trim() } : null;
    });
    const units = new Map<string, number>();
    for (const entry of parsed) if (entry) units.set(entry.unit, (units.get(entry.unit) ?? 0) + 1);
    const [unit, count] = [...units.entries()].sort((a, b) => b[1] - a[1])[0] ?? ["", 0];
    let summary: string;
    if (count >= Math.max(2, parsed.length * 0.8)) {
      const numbers = parsed.filter((entry) => entry?.unit === unit).map((entry) => entry!.number);
      const low = Math.min(...numbers);
      const high = Math.max(...numbers);
      summary = `${low === high ? decimal(low) : `${decimal(low)}–${decimal(high)}`}${unit ? ` ${unit}` : ""} (${have})`;
    } else {
      const counted = [...perValue.entries()]
        .map(([text, ids]) => [text, ids.size] as const)
        .sort((a, b) => b[1] - a[1]);
      const shown = counted.slice(0, 6).map(([text, n]) => `${text} (${n})`);
      const more = counted.length > 6 ? `, ${counted.length - 6} more values` : "";
      summary = `${shown.join(", ")}${more}; ${have}`;
    }
    rows.push({ name, summary, coverage: products.size });
  }
  return rows
    .sort((a, b) => b.coverage - a.coverage || a.name.localeCompare(b.name))
    .slice(0, 14)
    .map(({ name, summary }) => ({ name, summary }));
}

export interface FaqContext {
  id: string;
  slug: string;
  parentId: string | null;
  item: Omit<FaqItem, "answeredAbove" | "previous">;
}

/** The categories that get questions, with what their writer is given. Top-level categories first. */
export async function loadFaqContexts(db: Database): Promise<FaqContext[]> {
  const categories = await db
    .select({
      id: schema.categories.id,
      slug: schema.categories.slug,
      name: schema.categories.name,
      parentId: schema.categories.parentId,
      description: schema.categories.description,
      sortOrder: schema.categories.sortOrder,
    })
    .from(schema.categories)
    .where(isNull(schema.categories.deletedAt));
  const products = await db
    .select({ id: schema.products.id, categoryId: schema.products.categoryId, brand: schema.products.brand })
    .from(schema.products)
    .where(eq(schema.products.active, true));
  const values =
    products.length === 0
      ? []
      : await db
          .select({
            productId: schema.productAttributeValues.productId,
            name: schema.attributes.name,
            value: schema.productAttributeValues.value,
          })
          .from(schema.productAttributeValues)
          .innerJoin(schema.attributes, eq(schema.attributes.id, schema.productAttributeValues.attributeId))
          .where(
            inArray(
              schema.productAttributeValues.productId,
              products.map((product) => product.id),
            ),
          );

  const byId = new Map(categories.map((category) => [category.id, category]));
  const children = (id: string) =>
    categories.filter((category) => category.parentId === id).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const subtree = (id: string): Set<string> =>
    new Set([id, ...children(id).flatMap((child) => [...subtree(child.id)])]);
  const rootOf = (id: string): string => {
    const category = byId.get(id);
    return category?.parentId && byId.has(category.parentId) ? rootOf(category.parentId) : (category?.slug ?? "");
  };

  const contexts: FaqContext[] = [];
  for (const category of categories) {
    const ids = subtree(category.id);
    const inside = products.filter((product) => product.categoryId !== null && ids.has(product.categoryId));
    // Questions where there is demand and enough to answer from; an introduction wherever the page has none.
    const ask = Boolean(FAQ_TOPICS[category.slug]) && inside.length >= FAQ_MIN_PRODUCTS;
    const writeIntro = !category.description?.trim() && inside.length >= FAQ_MIN_INTRO_PRODUCTS;
    if (!ask && !writeIntro) continue;
    const productIds = new Set(inside.map((product) => product.id));
    const brands = new Map<string, number>();
    for (const product of inside) if (product.brand) brands.set(product.brand, (brands.get(product.brand) ?? 0) + 1);
    const root = rootOf(category.id);
    const parent = category.parentId ? byId.get(category.parentId) : undefined;
    contexts.push({
      id: category.id,
      slug: category.slug,
      parentId: parent ? parent.id : null,
      item: {
        slug: category.slug,
        name: category.name,
        parent: parent?.name ?? null,
        subcategories: children(category.id).map((child) => child.name),
        description: category.description?.trim() || null,
        sectionNotes: SECTION_NOTES[root] ?? null,
        facts: {
          products: inside.length,
          brands: [...brands.entries()]
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .slice(0, 10)
            .map(([name, count]) => ({ name, products: count })),
          specs: summarizeSpecs(
            values.filter((value) => productIds.has(value.productId)),
            inside.length,
          ),
        },
        installation: INSTALLATION[root] ?? null,
        searches: searchesFor(category.slug),
        questionRange: ask ? questionRange(category.parentId === null) : { min: 0, max: 0 },
        writeIntro,
      },
    });
  }
  return contexts.sort((a, b) => Number(a.parentId !== null) - Number(b.parentId !== null));
}

/* --- The form of an answer ----------------------------------------------------------------------------------- */

const comparable = (question: string) =>
  normalizePhrase(question)
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .replace(/\s+/g, " ");
const PRICE = /\d[\d\s.,]*\s*(?:€|евро|eur\b|лв\b|лв\.|лева)/iu;
const CONTACT = /@|\+359|\b0\d{8,9}\b|https?:|www\./iu;
const MARKUP = /\*\*|`|^#|^\s*[-*•]\s|\n\s*[-*•]\s/mu;
const EMOJI = /\p{Extended_Pictographic}/u;

/** How many questions a page gets: more for a top-level category, fewer for one of its sections. */
export const questionRange = (topLevel: boolean) => (topLevel ? { min: 5, max: 7 } : { min: 3, max: 5 });

/** Why a draft cannot go to the second reader as it is; empty when its form is right. */
export function checkFaqAnswer(item: FaqItem, answer: FaqAnswer): string[] {
  const issues: string[] = [];
  const { min, max } = item.questionRange;
  if (answer.questions.length < min || answer.questions.length > max) {
    issues.push(
      max === 0
        ? `Write no questions for this category, only its introduction and meta description.`
        : `Write ${min} to ${max} questions; there are ${answer.questions.length}.`,
    );
  }
  if (item.writeIntro) {
    const intro = answer.intro?.trim() ?? "";
    const meta = answer.metaDescription?.trim() ?? "";
    if (!intro) issues.push("Write the introduction: the category has none of its own.");
    if (!meta) issues.push("Write the meta description.");
    else if (meta.length < 110 || meta.length > 170) {
      issues.push(`Keep the meta description to 110–170 characters; it has ${meta.length}.`);
    }
    if (/\n/.test(meta)) issues.push("Write the meta description as one line.");
    for (const [label, text] of [
      ["introduction", intro],
      ["meta description", meta],
    ] as const) {
      if (!text) continue;
      if (MARKUP.test(text) || text.includes("!") || EMOJI.test(text)) {
        issues.push(`Plain text only in the ${label}: no Markdown, lists, emoji or exclamation marks.`);
      }
      if (PRICE.test(text)) issues.push(`State no prices in the ${label}: they change.`);
      if (CONTACT.test(text)) issues.push(`No links or contact details in the ${label}.`);
      const letters = text.match(/\p{L}/gu) ?? [];
      const cyrillic = letters.filter((letter) => /\p{Script=Cyrillic}/u.test(letter)).length;
      if (letters.length > 0 && cyrillic / letters.length < 0.7) issues.push(`Write the ${label} in Bulgarian.`);
    }
  }
  const above = new Set(item.answeredAbove.map(comparable));
  const seen = new Set<string>();
  for (const { question, answer: text } of answer.questions) {
    const short = question.length > 60 ? `${question.slice(0, 57)}…` : question;
    if (!question.trim().endsWith("?")) issues.push(`End the question „${short}“ with a question mark.`);
    if (MARKUP.test(question) || MARKUP.test(text)) issues.push(`Plain text only, no Markdown or lists („${short}“).`);
    if (text.includes("!") || question.includes("!")) issues.push(`No exclamation marks („${short}“).`);
    if (EMOJI.test(question) || EMOJI.test(text)) issues.push(`No emoji („${short}“).`);
    if (PRICE.test(text) || PRICE.test(question)) {
      issues.push(`State no prices („${short}“): they change; say the listing shows the current prices.`);
    }
    if (CONTACT.test(text) || CONTACT.test(question)) issues.push(`No links or contact details („${short}“).`);
    const letters = `${question} ${text}`.match(/\p{L}/gu) ?? [];
    const cyrillic = letters.filter((letter) => /\p{Script=Cyrillic}/u.test(letter)).length;
    if (letters.length > 0 && cyrillic / letters.length < 0.7) issues.push(`Write in Bulgarian („${short}“).`);
    const key = comparable(question);
    if (seen.has(key)) issues.push(`Two questions ask the same („${short}“).`);
    seen.add(key);
    if (above.has(key)) issues.push(`The parent category's page already answers „${short}“: ask something else.`);
  }
  return issues;
}

/* --- Running it ---------------------------------------------------------------------------------------------- */

export interface FaqOptions {
  db: Database;
  logger: Logger;
  /** Without it the run only plans. */
  apply: boolean;
  slugs?: readonly string[];
  /** Write again questions that were published, held or given up on (never the admin's). */
  force?: boolean;
  model: string;
  reviewModel: string;
  generate: Generate;
  skillsDir: string;
  concurrency: number;
}

export interface FaqResult {
  planned: string[];
  published: string[];
  held: string[];
  failed: string[];
  sessions: number;
  failedSessions: number;
  stopped: string | null;
}

type FaqRow = typeof schema.categoryFaqs.$inferSelect;

async function loadFaqRows(db: Database): Promise<Map<string, FaqRow>> {
  const rows = await db.select().from(schema.categoryFaqs);
  return new Map(rows.map((row) => [row.categoryId, row]));
}

/** Whether a category's questions are to be written this run: also published ones still missing their introduction. */
export function needsFaqWork(row: FaqRow | undefined, force: boolean, writeIntro = false): boolean {
  if (!row) return true;
  if (row.source === "admin") return false;
  if (row.status === "revise") return true;
  if (writeIntro && row.status === "published" && !row.intro) return true;
  return force;
}

/** Saves where a category's questions stand; never over questions the admin has made their own. */
async function saveFaq(
  db: Database,
  categoryId: string,
  values: { status: CategoryFaqStatus } & Partial<
    Pick<FaqRow, "items" | "intro" | "metaDescription" | "draft" | "notes" | "attempts" | "model">
  >,
): Promise<void> {
  await db
    .insert(schema.categoryFaqs)
    .values({ categoryId, ...values })
    .onConflictDoUpdate({
      target: schema.categoryFaqs.categoryId,
      set: { ...values, updatedAt: new Date() },
      setWhere: ne(schema.categoryFaqs.source, "admin"),
    });
}

/** The answers in a session's output, by category slug; the ones that did not parse, with why. */
function parseBySlug<T extends { slug: string }>(
  output: unknown,
  itemSchema: z.ZodType<T>,
): { answers: Map<string, T>; invalid: Map<string, string> } {
  const answers = new Map<string, T>();
  const invalid = new Map<string, string>();
  const envelope = z.object({ categories: z.array(z.unknown()) }).safeParse(output);
  if (!envelope.success) return { answers, invalid };
  for (const raw of envelope.data.categories) {
    const parsed = itemSchema.safeParse(raw);
    const slug = (raw as { slug?: unknown } | null)?.slug;
    if (parsed.success) answers.set(parsed.data.slug, parsed.data);
    else if (typeof slug === "string")
      invalid.set(slug, `The answer did not match the format: ${z.prettifyError(parsed.error)}`);
  }
  return { answers, invalid };
}

async function runSession(
  options: FaqOptions,
  skill: "catalog-faq" | "catalog-faq-review",
  batch: FaqBatch | FaqReviewBatch,
  model: string,
): Promise<SessionResult> {
  const workspace = await createWorkspace(options.skillsDir, skill);
  try {
    const batchFile = "batch.json";
    await writeFile(path.join(workspace, batchFile), JSON.stringify(batch, null, 2), "utf8");
    const request: SessionRequest = {
      skill,
      workspace,
      batchFile,
      schema: skill === "catalog-faq" ? FAQ_OUTPUT_JSON_SCHEMA : FAQ_REVIEW_OUTPUT_JSON_SCHEMA,
      // The writer may check a general claim before making it; the reader checks the ones it doubts.
      web: true,
      images: [],
      maxTurns: 12 + 6 * batch.categories.length,
      timeoutMs: 30 * 60_000,
    };
    return await options.generate(request, model);
  } finally {
    await rm(workspace, { recursive: true, force: true }).catch(() => undefined);
  }
}

interface Pending {
  context: FaqContext;
  attempts: number;
  previous: FaqItem["previous"];
}

/** Writes and checks the questions of the planned categories: top-level ones first, so sections can avoid theirs. */
export async function runCategoryFaq(options: FaqOptions): Promise<FaqResult> {
  const log = options.logger;
  const contexts = await loadFaqContexts(options.db);
  let rows = await loadFaqRows(options.db);
  const wanted =
    options.slugs && options.slugs.length > 0
      ? contexts.filter((context) => options.slugs!.includes(context.slug))
      : contexts;
  const planned = wanted.filter((context) =>
    needsFaqWork(rows.get(context.id), options.force ?? false, context.item.writeIntro),
  );
  const result: FaqResult = {
    planned: planned.map((context) => context.slug),
    published: [],
    held: [],
    failed: [],
    sessions: 0,
    failedSessions: 0,
    stopped: null,
  };
  if (!options.apply || planned.length === 0) return result;

  const stop = (failure: string, error: SessionError) => {
    result.stopped ??= `${failure}: ${error.message}`;
    log.error("faq.stopped", { failure, message: error.message, detail: scrubForLog(error.detail) });
  };

  const answeredAbove = (context: FaqContext): string[] =>
    context.parentId ? (rows.get(context.parentId)?.items ?? []).map((item) => item.question) : [];

  const runBatch = async (batch: FaqContext[]): Promise<void> => {
    let pending: Pending[] = batch.map((context) => {
      const row = rows.get(context.id);
      // A draft that did not pass (sent back, held or given up on) is fixed from the reader's notes, even when
      // forced; only published questions are written afresh.
      // Published questions still missing their introduction are kept; only the introduction is new.
      const previous =
        row && row.status !== "published" && row.draft
          ? { questions: row.draft, notes: (row.notes ?? "").split("\n").filter(Boolean) }
          : row?.status === "published" && context.item.writeIntro && !row.intro && !options.force
            ? { questions: row.items, notes: [KEEP_QUESTIONS] }
            : null;
      return { context, attempts: options.force ? 0 : (row?.attempts ?? 0), previous };
    });

    while (pending.length > 0 && result.stopped === null) {
      const items = new Map(
        pending.map((entry) => [
          entry.context.slug,
          { ...entry.context.item, answeredAbove: answeredAbove(entry.context), previous: entry.previous } as FaqItem,
        ]),
      );
      const sentBack: Array<{ entry: Pending; draft: CategoryFaqItem[] | null; answer?: FaqAnswer; issues: string[] }> =
        [];

      log.info("faq.write.start", { categories: [...items.keys()] });
      let written: SessionResult | null = null;
      try {
        written = await runSession(
          options,
          "catalog-faq",
          { version: 1, categories: [...items.values()] },
          options.model,
        );
        result.sessions += 1;
      } catch (error) {
        if (error instanceof SessionError && error.failure !== "batch") return stop(error.failure, error);
        result.failedSessions += 1;
        const message = error instanceof Error ? error.message : String(error);
        log.warn("faq.write.failed", { message: scrubForLog(message) });
        for (const entry of pending)
          sentBack.push({ entry, draft: null, issues: [`The writing session failed: ${message}`] });
      }

      const toReview: Array<{ entry: Pending; answer: FaqAnswer }> = [];
      if (written) {
        const { answers, invalid } = parseBySlug(written.output, faqCategorySchema);
        for (const entry of pending) {
          const answer = answers.get(entry.context.slug);
          if (!answer) {
            sentBack.push({
              entry,
              draft: null,
              issues: [invalid.get(entry.context.slug) ?? "The answer had no questions for this category."],
            });
            continue;
          }
          const issues = checkFaqAnswer(items.get(entry.context.slug)!, answer);
          if (issues.length > 0) sentBack.push({ entry, draft: answer.questions, answer, issues });
          else toReview.push({ entry, answer });
        }
      }

      if (toReview.length > 0) {
        const reviewBatch: FaqReviewBatch = {
          version: 1,
          categories: toReview.map(({ entry, answer }) => ({
            ...entry.context.item,
            answeredAbove: answeredAbove(entry.context),
            questions: answer.questions,
            intro: entry.context.item.writeIntro ? (answer.intro?.trim() ?? null) : null,
            metaDescription: entry.context.item.writeIntro ? (answer.metaDescription?.trim() ?? null) : null,
          })),
        };
        log.info("faq.review.start", { categories: toReview.map(({ entry }) => entry.context.slug) });
        try {
          const reviewed = await runSession(options, "catalog-faq-review", reviewBatch, options.reviewModel);
          result.sessions += 1;
          const { answers: verdicts } = parseBySlug(reviewed.output, faqReviewCategorySchema);
          for (const { entry, answer } of toReview) {
            const verdict = verdicts.get(entry.context.slug);
            if (!verdict) {
              sentBack.push({ entry, draft: answer.questions, answer, issues: ["The second reader gave no verdict."] });
            } else if (verdict.verdict === "pass") {
              await saveFaq(options.db, entry.context.id, {
                status: "published",
                items: answer.questions,
                intro: entry.context.item.writeIntro ? (answer.intro?.trim() ?? null) : null,
                metaDescription: entry.context.item.writeIntro ? (answer.metaDescription?.trim() ?? null) : null,
                draft: null,
                notes: null,
                attempts: 0,
                model: options.model,
              });
              result.published.push(entry.context.slug);
              log.info("faq.published", { category: entry.context.slug, questions: answer.questions.length });
            } else if (verdict.verdict === "hold") {
              await saveFaq(options.db, entry.context.id, {
                status: "held",
                draft: answer.questions,
                notes: verdict.issues.join("\n"),
                attempts: entry.attempts + 1,
                model: options.model,
              });
              result.held.push(entry.context.slug);
              log.warn("faq.held", { category: entry.context.slug, issues: verdict.issues });
            } else {
              sentBack.push({ entry, draft: answer.questions, answer, issues: verdict.issues });
            }
          }
        } catch (error) {
          if (error instanceof SessionError && error.failure !== "batch") return stop(error.failure, error);
          result.failedSessions += 1;
          const message = error instanceof Error ? error.message : String(error);
          log.warn("faq.review.failed", { message: scrubForLog(message) });
          for (const { entry, answer } of toReview) {
            sentBack.push({
              entry,
              draft: answer.questions,
              answer,
              issues: [`The review session failed: ${message}`],
            });
          }
        }
      }

      const next: Pending[] = [];
      for (const { entry, draft, answer, issues } of sentBack) {
        const attempts = entry.attempts + 1;
        const status: CategoryFaqStatus = attempts >= MAX_ATTEMPTS ? "failed" : "revise";
        await saveFaq(options.db, entry.context.id, {
          status,
          draft: draft ?? entry.previous?.questions ?? null,
          notes: issues.join("\n"),
          attempts,
          model: options.model,
        });
        if (status === "failed") {
          result.failed.push(entry.context.slug);
          log.warn("faq.failed", { category: entry.context.slug, issues });
        } else {
          log.info("faq.revise", { category: entry.context.slug, issues });
          next.push({
            ...entry,
            attempts,
            previous: {
              questions: draft ?? entry.previous?.questions ?? [],
              intro: answer?.intro ?? entry.previous?.intro ?? null,
              metaDescription: answer?.metaDescription ?? entry.previous?.metaDescription ?? null,
              notes: issues,
            },
          });
        }
      }
      pending = next;
    }
  };

  // Top-level categories first: their published questions are what the sections must not ask again.
  for (const phase of [
    planned.filter((context) => context.parentId === null),
    planned.filter((context) => context.parentId !== null),
  ]) {
    if (phase.length === 0 || result.stopped !== null) continue;
    rows = await loadFaqRows(options.db);
    const batches: FaqContext[][] = [];
    for (let i = 0; i < phase.length; i += BATCH_SIZE) batches.push(phase.slice(i, i + BATCH_SIZE));
    const worker = async () => {
      for (let batch = batches.shift(); batch && result.stopped === null; batch = batches.shift())
        await runBatch(batch);
    };
    await Promise.all(Array.from({ length: Math.max(1, options.concurrency) }, worker));
  }
  return result;
}
