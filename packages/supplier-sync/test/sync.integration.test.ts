/**
 * End-to-end sync against a real Postgres and a fake supplier API.
 *
 * Needs a disposable, fully migrated database (tables are truncated!):
 *   SUPPLIER_SYNC_TEST_DATABASE_URL=postgres://postgres:devpass@localhost:55432/ecommerce pnpm test
 * Refuses to run against anything but localhost.
 */
import * as schema from "@ecommerce/database/schema";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { addLocks, editedLockableFields } from "../src/locks";
import { silentLogger } from "../src/logger";
import { applyCategoryTree } from "../src/sync/curation";
import { applySyncChange, followSupplierForField, publishAllNewProducts } from "../src/sync/review";
import { runSupplierSync, type SyncMode } from "../src/sync/run";

const url = process.env.SUPPLIER_SYNC_TEST_DATABASE_URL;
const isLocal = !!url && ["localhost", "127.0.0.1"].includes(new URL(url).hostname);

type FakeProduct = {
  name: string;
  price: number | null;
  inStock?: boolean;
  categories?: number[];
  colour?: string;
};

function wooProduct(id: number, p: FakeProduct) {
  const price = p.price === null ? "" : String(p.price);
  return {
    id,
    name: p.name,
    slug: `p-${id}`,
    type: "simple",
    permalink: `https://supplier.test/product/p-${id}/`,
    sku: "",
    short_description: "",
    description: `<p>Описание на ${p.name}</p>`,
    prices: {
      price,
      regular_price: price,
      sale_price: price,
      price_range: null,
      currency_code: "EUR",
      currency_minor_unit: 2,
    },
    images: [{ id: id * 10, src: `https://supplier.test/img/${id}.jpg`, name: "", alt: "" }],
    categories: (p.categories ?? [11]).map((c) => ({ id: c, name: "", slug: "" })),
    attributes: [
      {
        id: 3,
        name: "цвят",
        taxonomy: "pa_color",
        has_variations: false,
        terms: [{ id: 1, name: p.colour ?? "Бял", slug: "c" }],
      },
      {
        id: 13,
        name: "мощност отопление kW",
        taxonomy: "pa_power-heating-kw",
        has_variations: false,
        terms: [{ id: 2, name: "700 W", slug: "700-w" }],
      },
    ],
    is_purchasable: p.price !== null,
    is_in_stock: p.inStock ?? true,
    is_on_backorder: false,
  };
}

function fakeSupplier() {
  const categories = [
    { id: 10, name: "Пелетни камини", slug: "%d0%bf", parent: 0, count: 2 },
    { id: 11, name: "Камини с водна риза", slug: "vodna", parent: 10, count: 2 },
    { id: 15, name: "Uncategorized", slug: "uncategorized", parent: 0, count: 0 },
    { id: 16, name: "ТОП ОФЕРТИ", slug: "top", parent: 0, count: 1 },
  ];
  const products = new Map<number, { data: ReturnType<typeof wooProduct>; modified: string }>();
  let clock = 0;
  const put = (id: number, p: FakeProduct) => {
    clock += 1;
    products.set(id, {
      data: wooProduct(id, p),
      modified: `2026-11-0${Math.min(clock, 9)}T10:00:${String(clock).padStart(2, "0")}`,
    });
  };
  let listingBroken = false;

  const fetchImpl: typeof fetch = async (input) => {
    const target = new URL(input instanceof Request ? input.url : String(input));
    const json = (body: unknown) =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json", "x-wp-totalpages": "1" },
      });
    switch (target.pathname) {
      case "/wp-json/wc/store/v1/products/categories":
        return json(categories);
      case "/wp-json/wp/v2/product":
        return json(listingBroken ? [] : [...products].map(([id, p]) => ({ id, modified_gmt: p.modified })));
      case "/wp-json/wc/store/v1/products": {
        const include = target.searchParams.get("include");
        const ids = include ? include.split(",").map(Number) : [...products.keys()];
        return json(ids.filter((id) => products.has(id)).map((id) => products.get(id)!.data));
      }
      default:
        return new Response("not found", { status: 404 });
    }
  };

  return {
    put,
    remove: (id: number) => products.delete(id),
    breakListing: (broken: boolean) => {
      listingBroken = broken;
    },
    fetch: fetchImpl,
  };
}

describe.skipIf(!isLocal)("supplier sync (integration)", () => {
  const client = postgres(url ?? "postgres://localhost/none", { max: 1, onnotice: () => {} });
  const db = drizzle(client, { schema });
  let supplier: ReturnType<typeof fakeSupplier>;

  const sync = (mode: SyncMode, publishNew = false) =>
    runSupplierSync({
      db,
      mode,
      trigger: "cli",
      publishNew,
      fetch: supplier.fetch,
      requestDelayMs: 0,
      logger: silentLogger,
    });

  const productFor = async (externalId: number) => {
    const link = await db.query.supplierProducts.findFirst({
      where: eq(schema.supplierProducts.externalId, externalId),
    });
    if (!link?.productId) throw new Error(`No product for ${externalId}`);
    const product = await db.query.products.findFirst({
      where: eq(schema.products.id, link.productId),
      with: { defaultPrice: true, attributeValues: { with: { attribute: true } }, category: true },
    });
    if (!product) throw new Error(`Product ${link.productId} missing`);
    return { link, product };
  };

  const pending = (type?: string) =>
    db
      .select()
      .from(schema.syncChanges)
      .where(
        and(eq(schema.syncChanges.status, "pending"), type ? eq(schema.syncChanges.type, type as never) : undefined),
      );

  beforeEach(async () => {
    await db.execute(sql`TRUNCATE supplier, supplier_category, supplier_product, supplier_attribute, attribute,
      product_attribute_value, sync_run, sync_change, product, price, category CASCADE`);
    supplier = fakeSupplier();
    supplier.put(1, { name: "Камина Аrtel Nina 7", price: 100_000, categories: [10, 11] });
    supplier.put(2, { name: "Камина ARTEL Easy 12", price: 200_000, categories: [16, 11] });
    supplier.put(3, { name: "Камина Ocean 9", price: null });
  });

  afterAll(async () => {
    await client.end();
  });

  it("imports products as drafts with prices, categories and attributes", async () => {
    const result = await sync("full");
    expect(result.status).toBe("succeeded");
    expect(result.stats).toMatchObject({ seen: 3, fetched: 3, created: 3, failed: 0, pendingReview: 3 });

    const { product: nina } = await productFor(1);
    expect(nina.name).toBe("Камина Artel Nina 7");
    expect(nina.brand).toBe("Artel");
    expect(nina.active).toBe(false);
    expect(nina.defaultPrice).toMatchObject({ unitAmount: 100_000, currency: "eur", active: true });
    expect(nina.category?.name).toBe("Камини с водна риза"); // the deeper of its two categories
    expect(nina.images).toEqual(["https://supplier.test/img/1.jpg"]);
    const power = nina.attributeValues.find((v) => v.attribute.slug === "power-heating-kw");
    expect(power).toMatchObject({ value: "700 W", numericValue: 0.7, source: "supplier" });

    const { product: ocean } = await productFor(3);
    expect(ocean.defaultPrice).toBeNull(); // price on request: not purchasable
    expect((await productFor(2)).product.category?.name).toBe("Камини с водна риза"); // not the promo bucket

    const ours = await db.select().from(schema.categories);
    expect(ours.map((c) => c.slug).sort()).toEqual(["kamini-s-vodna-riza", "peletni-kamini"]);
    const child = ours.find((c) => c.slug === "kamini-s-vodna-riza");
    expect(child?.parentId).toBe(ours.find((c) => c.slug === "peletni-kamini")?.id);

    await publishAllNewProducts(db, null);
    expect((await productFor(2)).product.active).toBe(true);
    expect(await pending()).toHaveLength(0);
  });

  it("downloads nothing when nothing changed", async () => {
    await sync("full", true);
    const result = await sync("incremental");
    expect(result.stats).toMatchObject({ seen: 3, fetched: 0, created: 0, updated: 0 });
  });

  it("applies small price moves, queues large ones, and respects locks", async () => {
    await sync("full", true);

    const { product: ocean } = await productFor(3);
    await db
      .update(schema.products)
      .set({ name: "Камина Ocean 9 (нашето име)", lockedFields: ["name"] })
      .where(eq(schema.products.id, ocean.id));

    supplier.put(1, { name: "Камина Аrtel Nina 7", price: 105_000, categories: [10, 11] }); // +5%
    supplier.put(2, { name: "Камина ARTEL Easy 12", price: 260_000, inStock: false }); // +30%, out of stock
    supplier.put(3, { name: "Камина Ocean 9 kW", price: null }); // renamed while we lock the name

    const result = await sync("incremental");
    expect(result.stats).toMatchObject({ fetched: 3, updated: 3, failed: 0 });

    expect((await productFor(1)).product.defaultPrice?.unitAmount).toBe(105_000);

    const two = await productFor(2);
    expect(two.product.defaultPrice?.unitAmount).toBe(200_000); // unchanged until reviewed
    expect(two.product).toMatchObject({ trackInventory: true, stockQuantity: 0 });
    const [priceReview] = await pending("price_change");
    expect(priceReview).toMatchObject({ previousValue: 200_000, newValue: 260_000 });

    expect((await productFor(3)).product.name).toBe("Камина Ocean 9 (нашето име)");
    const [lockReview] = await pending("locked_field_changed");
    expect(lockReview).toMatchObject({ field: "name", newValue: "Камина Ocean 9 kW" });

    // A second small step must not sneak the large move through.
    supplier.put(2, { name: "Камина ARTEL Easy 12", price: 262_000, inStock: false });
    await sync("incremental");
    expect((await productFor(2)).product.defaultPrice?.unitAmount).toBe(200_000);
    const reviews = await pending("price_change");
    expect(reviews).toHaveLength(1);
    expect(reviews[0]?.newValue).toBe(262_000);

    await applySyncChange(db, reviews[0]!.id, null);
    expect((await productFor(2)).product.defaultPrice?.unitAmount).toBe(262_000);

    await followSupplierForField(db, (await productFor(3)).product.id, "name");
    const three = await productFor(3);
    expect(three.product.name).toBe("Камина Ocean 9 kW");
    expect(three.product.lockedFields).toEqual([]);
    expect(await pending("locked_field_changed")).toHaveLength(0);
  });

  it("locks the fields an admin edits, the way the product form does", async () => {
    await sync("full", true);
    const { product } = await productFor(1);

    // Same steps as the updateProduct server action.
    const current = await db.query.products.findFirst({
      where: eq(schema.products.id, product.id),
      with: { supplierProduct: { columns: { id: true } } },
    });
    expect(current?.supplierProduct).toBeTruthy();
    const patch = {
      name: "Камина Nina 7 (наше)",
      description: current!.description,
      trackInventory: true,
      stockQuantity: 2,
    };
    const lockedFields = addLocks(current!.lockedFields, editedLockableFields(current!, patch));
    expect(lockedFields).toEqual(["name", "stock"]);
    await db
      .update(schema.products)
      .set({ ...patch, lockedFields })
      .where(eq(schema.products.id, product.id));

    supplier.put(1, { name: "Камина Artel Nina 7 NEW", price: 100_000, categories: [10, 11], inStock: false });
    await sync("incremental");
    const after = await productFor(1);
    expect(after.product).toMatchObject({ name: "Камина Nina 7 (наше)", trackInventory: true, stockQuantity: 2 });
    const fields = (await pending("locked_field_changed")).map((c) => c.field).sort();
    expect(fields).toEqual(["name", "stock"]);
  });

  it("unpublishes a product only after two missed syncs, and queues its return", async () => {
    await sync("full", true);
    supplier.remove(2);

    await sync("incremental");
    expect((await productFor(2)).product.active).toBe(true);

    const second = await sync("incremental");
    expect(second.stats.removed).toBe(1);
    expect((await productFor(2)).product.active).toBe(false);

    supplier.put(2, { name: "Камина ARTEL Easy 12", price: 200_000 });
    const back = await sync("incremental");
    expect(back.stats.restored).toBe(1);
    expect((await productFor(2)).product.active).toBe(false);
    const [restored] = await pending("restored");
    await applySyncChange(db, restored!.id, null);
    expect((await productFor(2)).product.active).toBe(true);
  });

  it("refuses to unpublish when the supplier's listing suddenly comes back empty", async () => {
    await sync("full", true);
    supplier.breakListing(true);
    supplier.remove(1);
    supplier.remove(2);
    supplier.remove(3);
    const result = await sync("incremental");
    expect(result.status).toBe("failed");
    expect(result.message).toMatch(/listed only 0 products/);
    const active = await db.select().from(schema.products).where(eq(schema.products.active, true));
    expect(active).toHaveLength(3);
  });

  it("applies a curated category tree, reusing mirrored categories, and is idempotent", async () => {
    await sync("full", true);
    const tree = [
      { slug: "kamini", name: "Камини", supplierCategoryIds: [10] },
      { slug: "s-vodna-riza", name: "Камини с водна риза", parent: "kamini", supplierCategoryIds: [11] },
      { slug: "aksesoari", name: "Аксесоари", parent: "kamini" },
    ];
    const before = await db.select().from(schema.categories);
    const mirroredChild = before.find((c) => c.slug === "kamini-s-vodna-riza")!;

    const first = await applyCategoryTree(db, "hydroterm", tree);
    expect(first).toMatchObject({ created: 1, remapped: 0, retired: 0 });

    const after = await db.select().from(schema.categories);
    const root = after.find((c) => c.slug === "kamini")!;
    const child = after.find((c) => c.slug === "s-vodna-riza")!;
    expect(child.id).toBe(mirroredChild.id); // reused, re-slugged
    expect(child.parentId).toBe(root.id);
    expect(after.find((c) => c.slug === "aksesoari")?.parentId).toBe(root.id);
    expect((await productFor(1)).product.categoryId).toBe(child.id);

    expect(await applyCategoryTree(db, "hydroterm", tree)).toEqual({
      created: 0,
      updated: 0,
      remapped: 0,
      productsMoved: 0,
      retired: 0,
    });
  });

  it("skips while another run is in progress", async () => {
    await sync("full", true);
    const [row] = await db.select({ id: schema.suppliers.id }).from(schema.suppliers);
    await db.insert(schema.syncRuns).values({ supplierId: row!.id, mode: "full", trigger: "manual" });
    const result = await sync("incremental");
    expect(result.status).toBe("skipped");
  });
});
