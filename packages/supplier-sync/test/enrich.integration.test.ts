/**
 * Publishing an enrichment proposal, against a real Postgres.
 *
 * Needs a disposable, fully migrated database (tables are truncated!):
 *   SUPPLIER_SYNC_TEST_DATABASE_URL=postgres://postgres:devpass@localhost:55432/ecommerce_test pnpm test
 * Refuses to run against anything but localhost.
 */
import * as schema from "@ecommerce/database/schema";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { ResearchAnswer } from "../src/enrich/contract";
import { approveAllReady, approveEnrichment, rejectEnrichment } from "../src/enrich/publish";
import { loadEnrichState } from "../src/enrich/state";
import { markPending, proposalHash, saveStage, syncReviewFlag } from "../src/enrich/store";
import { validateResearch } from "../src/enrich/validate";

const url = process.env.SUPPLIER_SYNC_TEST_DATABASE_URL;
const isLocal = !!url && ["localhost", "127.0.0.1"].includes(new URL(url).hostname);

const OUR_DESCRIPTION =
  "Термопомпа въздух-вода за отопление, охлаждане и топла вода на нова, добре изолирана къща от около 130 m².";

const research: ResearchAnswer = {
  id: "",
  kind: "heat_pump",
  category: null,
  identity: { brand: "Artel", model: "MHP5RP24", nominal: { value: 5, unit: "kW" } },
  gtin: "4006381333931",
  mpn: "MHP5RP24",
  specs: [
    { key: "heatingKw", value: 4.65, condition: "A7/W35", source: "supplier_image", url: null, confidence: "high" },
    { key: "scop", value: 4.47, condition: "35 °C", source: "supplier_image", url: null, confidence: "high" },
  ],
  features: ["Вграден Wi-Fi модул"],
  images: [],
  sources: [],
  note: "",
};

describe.skipIf(!isLocal)("publishing enrichment (integration)", () => {
  const client = postgres(url ?? "postgres://localhost/none", { max: 1, onnotice: () => {} });
  const db = drizzle(client, { schema });
  const now = new Date("2026-11-18T12:00:00Z");

  /** A supplier-linked product with the supplier's wrong 17.6 kW, and every stage of a proposal for it. */
  async function seed(name: string, options: { flagged?: boolean; review?: "pass" | "revise" | "hold" | null } = {}) {
    const [supplier] = await db
      .insert(schema.suppliers)
      .values({ slug: `s-${name}`, name: "S", baseUrl: "https://supplier.test", platform: "woocommerce" })
      .returning();
    const [category] = await db
      .insert(schema.categories)
      .values({ name: "Термопомпи моноблок", slug: `monoblok-${name}` })
      .returning();
    const [product] = await db
      .insert(schema.products)
      .values({ name, slug: name, description: "Текст на доставчика.", type: "good" })
      .returning();
    const [link] = await db
      .insert(schema.supplierProducts)
      .values({
        supplierId: supplier!.id,
        externalId: Math.floor(Math.random() * 1e6),
        productId: product!.id,
        name,
        inStock: true,
        purchasable: true,
        data: {},
        contentHash: "x",
      })
      .returning();
    const [power] = await db
      .insert(schema.attributes)
      .values({ slug: "power-heating", name: "мощност отопление kW", unit: "kW" })
      .onConflictDoUpdate({ target: schema.attributes.slug, set: { name: "мощност отопление kW" } })
      .returning();
    const [colour] = await db
      .insert(schema.attributes)
      .values({ slug: "color", name: "цвят" })
      .onConflictDoUpdate({ target: schema.attributes.slug, set: { name: "цвят" } })
      .returning();
    await db.insert(schema.productAttributeValues).values([
      { productId: product!.id, attributeId: power!.id, value: "17.6 kW", numericValue: 17.6, source: "supplier" },
      { productId: product!.id, attributeId: colour!.id, value: "Бял", source: "supplier" },
    ]);

    const validation = validateResearch({
      name: options.flagged ? "Термопомпа Artel MHP5RP24" : "ТЕРМОПОМПА ARTEL R32 MONO 5KW",
      kind: "heat_pump",
      categorySlug: null,
      // Without a figure in the name or the model code, nothing settles the supplier's 17.6 kW.
      research: {
        ...research,
        id: product!.id,
        identity: { ...research.identity, nominal: options.flagged ? null : research.identity.nominal },
      },
      supplierAttributes: [
        { slug: "power-heating", name: "мощност отопление kW", unit: "kW", value: "17.6 kW", numericValue: 17.6 },
      ],
    });
    expect(validation.problems.length > 0).toBe(Boolean(options.flagged));
    const write = (status: "succeeded" | "flagged" | "failed", output: unknown, errors: string[] = []) => ({
      status,
      inputsHash: "h",
      output,
      errors,
      model: "m",
      startedAt: now,
      finishedAt: now,
    });
    await saveStage(db, product!.id, "extract", write("succeeded", { ...research, kind: "heat_pump" }));
    await saveStage(
      db,
      product!.id,
      "validate",
      write(validation.problems.length ? "flagged" : "succeeded", validation, validation.problems),
    );
    await saveStage(
      db,
      product!.id,
      "classify",
      write("succeeded", {
        kind: "heat_pump",
        category: { slug: category!.slug, name: category!.name, reason: "моноблок" },
        images: [],
      }),
    );
    await saveStage(
      db,
      product!.id,
      "rewrite",
      write("succeeded", {
        name: "Термопомпа въздух-вода Artel MHP5RP24",
        metaDescription: "Мета описание на продукта, достатъчно дълго, за да мине проверката за дължина.",
        description: OUR_DESCRIPTION,
      }),
    );
    // The second reader's verdict on that copy (none: not reviewed yet).
    const verdict = options.review === undefined ? "pass" : options.review;
    if (verdict) {
      const issues = verdict === "pass" ? [] : ["The description says 45 kg; the specs say 52 kg."];
      await saveStage(
        db,
        product!.id,
        "review",
        write(
          verdict === "pass" ? "succeeded" : verdict === "hold" ? "flagged" : "failed",
          { verdict, issues, keywords: null },
          issues,
        ),
      );
    }
    const state = await loadEnrichState(db, { productIds: [product!.id] });
    await markPending(db, product!.id, proposalHash(state.products[0]!.stages), now);
    await syncReviewFlag(
      db,
      { id: product!.id, supplierId: supplier!.id, supplierProductId: link!.id },
      validation.problems,
      now,
    );
    return { product: product!, category: category! };
  }

  const stageOf = async (productId: string, stage: "publish") =>
    db.query.productEnrichments.findFirst({
      where: and(eq(schema.productEnrichments.productId, productId), eq(schema.productEnrichments.stage, stage)),
    });

  beforeEach(async () => {
    await db.execute(sql`TRUNCATE supplier, supplier_product, attribute, product_attribute_value, sync_change,
      product, category, product_enrichment, image_asset CASCADE`);
  });

  afterAll(async () => {
    await client.end();
  });

  it("publishes the copy, the specs and the category, and locks them against the sync", async () => {
    const { product, category } = await seed("p1");
    await approveEnrichment(
      db,
      { productId: product.id, userId: null, parts: { copy: true, specs: true, category: true } },
      now,
    );

    const after = await db.query.products.findFirst({
      where: eq(schema.products.id, product.id),
      with: { attributeValues: { with: { attribute: true } } },
    });
    expect(after!.name).toBe("Термопомпа въздух-вода Artel MHP5RP24");
    expect(after!.description).toBe(OUR_DESCRIPTION);
    expect(after!.metadata).toMatchObject({
      metaDescription: expect.stringContaining("Мета"),
      gtin: "4006381333931",
      mpn: "MHP5RP24",
    });
    expect(after!.categoryId).toBe(category.id);
    expect(after!.lockedFields.sort()).toEqual(["attributes", "categoryId", "description", "name"]);
    expect(after!.marketingFeatures).toEqual([{ name: "Вграден Wi-Fi модул" }]);

    const values = Object.fromEntries(after!.attributeValues.map((v) => [v.attribute.slug, `${v.value}|${v.source}`]));
    // The supplier's 17.6 kW is gone; their colour (a field the research did not cover) stays.
    expect(values).toEqual({ "power-heating": "4,65 kW|enrichment", scop: "4,47|enrichment", color: "Бял|supplier" });
    const power = after!.attributeValues.find((v) => v.attribute.slug === "power-heating")!;
    expect(power.attribute.name).toBe("Мощност отопление");
    expect(power.numericValue).toBe(4.65);

    expect((await stageOf(product.id, "publish"))!.status).toBe("approved");
  });

  it("publishes only the parts approved, with the admin's corrections", async () => {
    const { product } = await seed("p2");
    await approveEnrichment(
      db,
      {
        productId: product.id,
        userId: null,
        parts: { copy: true, specs: true, category: false },
        edits: {
          name: "Термопомпа Artel MHP5RP24, 5 kW",
          specs: [
            { key: "heatingKw", value: "4,7", include: true },
            { key: "scop", value: "4,47", include: false },
          ],
        },
      },
      now,
    );
    const after = await db.query.products.findFirst({
      where: eq(schema.products.id, product.id),
      with: { attributeValues: { with: { attribute: true } } },
    });
    expect(after!.name).toBe("Термопомпа Artel MHP5RP24, 5 kW");
    expect(after!.categoryId).toBeNull();
    expect(after!.lockedFields).not.toContain("categoryId");
    expect(after!.attributeValues.map((v) => `${v.attribute.slug}=${v.value}`).sort()).toEqual([
      "color=Бял",
      "power-heating=4,7 kW",
    ]);
  });

  it("refuses an edited value that is not a number", async () => {
    const { product } = await seed("p3");
    await expect(
      approveEnrichment(db, {
        productId: product.id,
        userId: null,
        parts: { copy: false, specs: true, category: false },
        edits: { specs: [{ key: "heatingKw", value: "много", include: true }] },
      }),
    ).rejects.toThrow(/not a number/);
  });

  it("approves in bulk what the reviewer passed, a held product without its contested figure", async () => {
    const clean = await seed("clean");
    const flagged = await seed("flagged", { flagged: true });
    const held = await seed("held", { review: "hold" });
    const sentBack = await seed("sent-back", { review: "revise" });
    const unreviewed = await seed("unreviewed", { review: null });

    expect((await approveAllReady(db, null, now)).sort()).toEqual([clean.product.id, flagged.product.id].sort());
    for (const left of [held, sentBack, unreviewed]) {
      expect((await stageOf(left.product.id, "publish"))!.status).toBe("pending");
    }
    // Neither the supplier's contested 17.6 kW nor the research's 4.65 kW is shown until a person settles it.
    const after = await db.query.products.findFirst({
      where: eq(schema.products.id, flagged.product.id),
      with: { attributeValues: { with: { attribute: true } } },
    });
    expect(after!.attributeValues.map((value) => value.attribute.slug)).not.toContain("power-heating");
    expect(after!.attributeValues.some((value) => /4,65|17\.6/.test(value.value))).toBe(false);
    expect(after!.lockedFields).toContain("description");
  });

  it("closes the queue entry of a flagged product rejected by hand", async () => {
    const flagged = await seed("flagged", { flagged: true, review: "hold" });
    const queue = () => db.select().from(schema.syncChanges).where(eq(schema.syncChanges.type, "enrichment_flagged"));
    expect((await queue()).map((row) => [row.productId, row.status])).toEqual([[flagged.product.id, "pending"]]);

    await rejectEnrichment(db, flagged.product.id, null, now);
    expect((await stageOf(flagged.product.id, "publish"))!.status).toBe("rejected");
    expect((await queue())[0]!.status).toBe("dismissed");
  });

  it("asks again when the proposal changes after approval", async () => {
    const { product } = await seed("p4");
    await approveEnrichment(
      db,
      { productId: product.id, userId: null, parts: { copy: true, specs: true, category: true } },
      now,
    );
    const state = await loadEnrichState(db, { productIds: [product.id] });
    // Same proposal: nothing to ask.
    expect(await markPending(db, product.id, proposalHash(state.products[0]!.stages), now)).toBe(false);
    // A new rewrite (the supplier changed the product): pending again.
    await saveStage(db, product.id, "rewrite", {
      status: "succeeded",
      inputsHash: "h2",
      output: {
        name: "Нова",
        metaDescription: "Ново мета описание, достатъчно дълго за проверката.",
        description: `Ново. ${OUR_DESCRIPTION}`,
      },
      errors: [],
      model: "m",
      startedAt: now,
      finishedAt: now,
    });
    const changed = await loadEnrichState(db, { productIds: [product.id] });
    expect(await markPending(db, product.id, proposalHash(changed.products[0]!.stages), now)).toBe(true);
    expect((await stageOf(product.id, "publish"))!.status).toBe("pending");
  });
});
