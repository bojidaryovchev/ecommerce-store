/**
 * The category questions pipeline (enrich/faq.ts) against a real Postgres, with a scripted writer and reader.
 *
 * Needs a disposable, fully migrated database (tables are truncated!):
 *   SUPPLIER_SYNC_TEST_DATABASE_URL=postgres://postgres:devpass@localhost:55432/ecommerce_test pnpm test
 * Refuses to run against anything but localhost.
 */
import * as schema from "@ecommerce/database/schema";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { SessionRequest, SessionResult } from "../src/enrich/claude";
import type { FaqBatch, FaqReviewBatch } from "../src/enrich/contract";
import { runCategoryFaq } from "../src/enrich/faq";
import type { Logger } from "../src/logger";

const url = process.env.SUPPLIER_SYNC_TEST_DATABASE_URL;
const isLocal = !!url && ["localhost", "127.0.0.1"].includes(new URL(url).hostname);
const skillsDir = path.resolve(import.meta.dirname, "../../../.claude/skills");
const quiet: Logger = { info: () => {}, warn: () => {}, error: () => {} };

const ANSWER = "Зависи от топлинните загуби на дома: изолацията, площта и климата, в който се намира къщата.";
const questions = (prefix: string, count: number) =>
  Array.from({ length: count }, (_, i) => ({
    question: `${prefix}: какво да проверя, точка ${i + 1}?`,
    answer: ANSWER,
  }));

type Script = {
  write: (batch: FaqBatch, call: number) => { categories: unknown[] };
  review: (batch: FaqReviewBatch, call: number) => { categories: unknown[] };
};

/** An engine that reads the batch the pipeline wrote and answers from the script; it records every batch. */
function scripted(script: Script) {
  const writes: FaqBatch[] = [];
  const reviews: FaqReviewBatch[] = [];
  const generate = async (request: SessionRequest): Promise<SessionResult> => {
    const batch = JSON.parse(await readFile(path.join(request.workspace, request.batchFile), "utf8"));
    const output =
      request.skill === "catalog-faq"
        ? (writes.push(batch), script.write(batch, writes.length))
        : (reviews.push(batch), script.review(batch, reviews.length));
    return { output, costUsd: null, turns: 1, durationMs: 1 };
  };
  return { generate, writes, reviews };
}

const pass = (batch: FaqReviewBatch) => ({
  categories: batch.categories.map((category) => ({ slug: category.slug, verdict: "pass", issues: [] })),
});
const writeAll = (batch: FaqBatch) => ({
  categories: batch.categories.map((category) => ({
    slug: category.slug,
    questions: questions(category.name, category.parent === null ? 5 : 3),
  })),
});

describe.skipIf(!isLocal)("category questions (integration)", () => {
  const client = postgres(url ?? "postgres://localhost/none", { max: 1, onnotice: () => {} });
  const db = drizzle(client, { schema });

  /**
   * "Термопомпи" with its section "Термопомпи моноблок" holding ten Artel heat pumps from 4 to 16 kW. Both have
   * their own description, unless `intro` asks for a section that has none.
   */
  async function seed(options: { sectionDescription?: string | null } = {}) {
    const [root] = await db
      .insert(schema.categories)
      .values({ name: "Термопомпи", slug: "termopompi", description: "Термопомпите въздух-вода на магазина." })
      .returning();
    const [section] = await db
      .insert(schema.categories)
      .values({
        name: "Термопомпи моноблок",
        slug: "monoblok",
        parentId: root!.id,
        description:
          options.sectionDescription === undefined ? "Моноблоковете на магазина." : options.sectionDescription,
      })
      .returning();
    const [power] = await db
      .insert(schema.attributes)
      .values({ slug: "power-heating", name: "мощност отопление" })
      .returning();
    for (let i = 0; i < 10; i++) {
      const [product] = await db
        .insert(schema.products)
        .values({ name: `Термопомпа ${i}`, slug: `tp-${i}`, type: "good", brand: "Artel", categoryId: section!.id })
        .returning();
      await db
        .insert(schema.productAttributeValues)
        .values({ productId: product!.id, attributeId: power!.id, value: `${4 + (i * 12) / 9} kW`.replace(".", ",") });
    }
    return { root: root!, section: section! };
  }

  const run = (generate: ReturnType<typeof scripted>["generate"], extra: { force?: boolean } = {}) =>
    runCategoryFaq({
      db,
      logger: quiet,
      apply: true,
      model: "writer",
      reviewModel: "reader",
      generate: (request) => generate(request),
      skillsDir,
      concurrency: 1,
      ...extra,
    });

  const faqOf = async (categoryId: string) =>
    (await db.select().from(schema.categoryFaqs).where(eq(schema.categoryFaqs.categoryId, categoryId)))[0];

  beforeEach(async () => {
    await db.execute(sql`TRUNCATE attribute, product_attribute_value, product, category, category_faq CASCADE`);
  });

  afterAll(async () => {
    await client.end();
  });

  it("publishes what the reader passes, the top level first, and the section avoids the parent's questions", async () => {
    const { root, section } = await seed();
    const engine = scripted({ write: writeAll, review: pass });

    const result = await run(engine.generate);

    expect(result.published.sort()).toEqual(["monoblok", "termopompi"]);
    expect(engine.writes.map((batch) => batch.categories.map((c) => c.slug))).toEqual([["termopompi"], ["monoblok"]]);
    const [rootBatch, sectionBatch] = engine.writes;
    // The writer gets the catalogue's figures and the searches, never a price.
    expect(rootBatch!.categories[0]!.facts.specs).toEqual([
      { name: "Мощност отопление", summary: "4–16 kW (10 of 10 products)" },
    ]);
    expect(rootBatch!.categories[0]!.facts.brands).toEqual([{ name: "Artel", products: 10 }]);
    expect(rootBatch!.categories[0]!.searches[0]).toEqual({ phrase: "термопомпа", volume: 5400 });
    expect(rootBatch!.categories[0]!.installation).toContain("heat pumps");
    expect(sectionBatch!.categories[0]!.answeredAbove).toEqual(questions("Термопомпи", 5).map((q) => q.question));

    const published = await faqOf(root.id);
    expect(published).toMatchObject({ status: "published", attempts: 0, draft: null, source: "generated" });
    expect(published!.items).toEqual(questions("Термопомпи", 5));
    expect((await faqOf(section.id))!.items).toHaveLength(3);

    // Nothing left to do on the next run.
    expect((await run(scripted({ write: writeAll, review: pass }).generate)).planned).toEqual([]);
  });

  it("sends a draft with a price back without the reader, and one the reader revises back with its notes", async () => {
    const { root } = await seed();
    const engine = scripted({
      write: (batch, call) => {
        const answer = writeAll(batch);
        // First draft: a price, caught by the code. Second: passes the code, the reader revises it. Third: passes.
        if (call === 1) {
          (answer.categories[0] as { questions: Array<{ answer: string }> }).questions[0]!.answer =
            "Цените започват от 2 400 € с ДДС, а по-мощните модели струват повече от това.";
        }
        return answer;
      },
      review: (batch, call) =>
        call === 1
          ? {
              categories: batch.categories.map((category) => ({
                slug: category.slug,
                verdict: "revise",
                issues: ["In the first question, say which homes the 4 kW models suit."],
              })),
            }
          : pass(batch),
    });

    const result = await run(engine.generate);

    expect(result.published).toContain("termopompi");
    const rootWrites = engine.writes.filter((batch) => batch.categories.some((c) => c.slug === "termopompi"));
    expect(rootWrites).toHaveLength(3);
    expect(rootWrites[1]!.categories[0]!.previous!.notes[0]).toContain("State no prices");
    expect(rootWrites[2]!.categories[0]!.previous!.notes).toEqual([
      "In the first question, say which homes the 4 kW models suit.",
    ]);
    // The reader never saw the draft with the price.
    expect(engine.reviews[0]!.categories[0]!.questions[0]!.answer).toBe(ANSWER);
    expect(await faqOf(root.id)).toMatchObject({ status: "published", attempts: 0, notes: null });
  });

  it("gives a section without a description of its own an introduction, keeping its published questions", async () => {
    const { section } = await seed({ sectionDescription: null });
    const INTRO =
      "При термопомпата моноблок цялата хидравлика е във външното тяло, а към дома влизат само водни тръби.";
    const META =
      "Термопомпи моноблок Artel от 4 до 16 kW за отопление, охлаждане и топла вода, с оглед и монтаж до ключ от нашия екип.";
    await db.insert(schema.categoryFaqs).values({
      categoryId: section.id,
      items: questions("Термопомпи моноблок", 3),
      status: "published",
    });
    const engine = scripted({
      write: (batch) => ({
        categories: batch.categories.map((category) => ({
          slug: category.slug,
          questions: category.previous?.questions ?? questions(category.name, category.parent === null ? 5 : 3),
          ...(category.writeIntro ? { intro: INTRO, metaDescription: META } : {}),
        })),
      }),
      review: pass,
    });

    const result = await run(engine.generate);

    // The section, which owes an introduction; the top level has its own description and was already done.
    const sectionWrite = engine.writes.flatMap((batch) => batch.categories).find((c) => c.slug === "monoblok")!;
    expect(sectionWrite.writeIntro).toBe(true);
    expect(sectionWrite.previous).toEqual({
      questions: questions("Термопомпи моноблок", 3),
      notes: [expect.stringContaining("Keep these questions")],
    });
    expect(engine.reviews.flatMap((batch) => batch.categories).find((c) => c.slug === "monoblok")).toMatchObject({
      intro: INTRO,
      metaDescription: META,
    });
    expect(result.published).toContain("monoblok");
    expect(await faqOf(section.id)).toMatchObject({
      status: "published",
      intro: INTRO,
      metaDescription: META,
      items: questions("Термопомпи моноблок", 3),
    });
  });

  it("keeps a held draft for the admin, gives up after three, and never touches the admin's questions", async () => {
    const { root, section } = await seed();
    // The section's questions are the admin's own.
    await db.insert(schema.categoryFaqs).values({
      categoryId: section.id,
      items: [{ question: "Свой въпрос?", answer: ANSWER }],
      status: "published",
      source: "admin",
    });
    const held = scripted({
      write: writeAll,
      review: (batch) => ({
        categories: batch.categories.map((category) => ({
          slug: category.slug,
          verdict: "hold",
          issues: ["The facts are too thin to answer the sizing question."],
        })),
      }),
    });

    const first = await run(held.generate);

    expect(first.planned).toEqual(["termopompi"]);
    expect(first.held).toEqual(["termopompi"]);
    expect(await faqOf(root.id)).toMatchObject({
      status: "held",
      items: [],
      draft: questions("Термопомпи", 5),
      notes: "The facts are too thin to answer the sizing question.",
    });
    expect((await faqOf(section.id))!.items).toEqual([{ question: "Свой въпрос?", answer: ANSWER }]);

    // Held questions wait for the admin, unless forced; forced, three drafts sent back end with giving up.
    expect((await run(scripted({ write: writeAll, review: pass }).generate)).planned).toEqual([]);
    const revising = scripted({
      write: writeAll,
      review: (batch) => ({
        categories: batch.categories.map((c) => ({ slug: c.slug, verdict: "revise", issues: ["Still vague."] })),
      }),
    });
    const forced = await run(revising.generate, { force: true });
    expect(forced.failed).toEqual(["termopompi"]);
    expect(revising.writes).toHaveLength(3);
    // Forced, the held draft is fixed from the reader's notes rather than written from nothing.
    expect(revising.writes[0]!.categories[0]!.previous).toEqual({
      questions: questions("Термопомпи", 5),
      notes: ["The facts are too thin to answer the sizing question."],
    });
    expect(await faqOf(root.id)).toMatchObject({ status: "failed", attempts: 3, notes: "Still vague." });
    expect((await faqOf(section.id))!.source).toBe("admin");
  });
});
