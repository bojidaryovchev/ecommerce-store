import * as schema from "@ecommerce/database/schema";
import { asc, inArray } from "drizzle-orm";
import { createHash } from "node:crypto";
import { stableStringify } from "../normalize/product";
import { renormalize } from "../sync/shared";
import type { DbExecutor } from "../types";
import { kindOfCategory, type ProductKind } from "./fields";

/**
 * Everything the pipeline reads about the catalogue, loaded at once (a few hundred products), and the
 * hashes that decide what still needs doing.
 */

export const STAGES = ["extract", "validate", "classify", "rewrite", "publish"] as const;
export type Stage = (typeof STAGES)[number];
export type StageRow = typeof schema.productEnrichments.$inferSelect;
export type ImageAssetRow = typeof schema.imageAssets.$inferSelect;

/**
 * Bump a stage's version to redo it for every product (its instructions or rules changed in a way that
 * should reach products already done). The hash of each stage's inputs includes it.
 */
// validate 2: a radiator's output compared with the supplier's at its rating; designer-rail and section ranges.
export const STAGE_VERSIONS = { extract: 1, validate: 2, rewrite: 1 } as const;

/** What the supplier says about a product (or, for a product of our own, what we say). */
export interface SourceFacts {
  name: string;
  description: string | null;
  brand: string | null;
  sku: string | null;
  attributes: Array<{ name: string; values: string[] }>;
  images: string[];
  categoryExternalIds: number[];
}

export interface EnrichProduct {
  id: string;
  slug: string | null;
  /** Our current name and description (the supplier's until a rewrite is published). */
  name: string;
  description: string | null;
  active: boolean;
  brand: string | null;
  lockedFields: string[];
  metadata: Record<string, string>;
  images: string[];
  category: { id: string; slug: string; name: string } | null;
  /** The top-level category, for the shop's section notes. */
  section: { id: string; slug: string; name: string } | null;
  /** The kind our category implies; null without a category. */
  kind: ProductKind | null;
  supplierId: string | null;
  supplierProductId: string | null;
  source: SourceFacts;
  attributeValues: Array<{
    attributeId: string;
    slug: string;
    name: string;
    unit: string | null;
    value: string;
    numericValue: number | null;
    source: "supplier" | "enrichment" | "manual";
  }>;
  stages: Partial<Record<Stage, StageRow>>;
}

export interface CategoryInfo {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  kind: ProductKind | null;
}

export interface EnrichState {
  products: EnrichProduct[];
  categories: CategoryInfo[];
  imageAssets: Map<string, ImageAssetRow>;
}

export const hashOf = (value: unknown): string => createHash("sha256").update(stableStringify(value)).digest("hex");

/** The whole catalogue, or only `productIds` (categories and image kinds are always loaded whole). */
export async function loadEnrichState(db: DbExecutor, filter: { productIds?: string[] } = {}): Promise<EnrichState> {
  const ids = filter.productIds;
  const [rows, categoryRows, stageRows, assetRows] = await Promise.all([
    db.query.products.findMany({
      ...(ids ? { where: inArray(schema.products.id, ids) } : {}),
      with: {
        attributeValues: {
          orderBy: [asc(schema.productAttributeValues.sortOrder)],
          with: { attribute: true },
        },
        supplierProduct: true,
      },
      orderBy: [asc(schema.products.createdAt)],
    }),
    db.query.categories.findMany({
      columns: { id: true, slug: true, name: true, parentId: true, deletedAt: true },
    }),
    ids
      ? db.select().from(schema.productEnrichments).where(inArray(schema.productEnrichments.productId, ids))
      : db.select().from(schema.productEnrichments),
    db.select().from(schema.imageAssets),
  ]);

  const byId = new Map(categoryRows.map((row) => [row.id, row]));
  const kindOf = (id: string | null): ProductKind | null => {
    let node = id ? byId.get(id) : undefined;
    for (let depth = 0; node && depth < 10; depth++) {
      const kind = kindOfCategory(node.slug);
      if (kind) return kind;
      node = node.parentId ? byId.get(node.parentId) : undefined;
    }
    return null;
  };
  const rootOf = (id: string | null) => {
    let node = id ? byId.get(id) : undefined;
    for (let depth = 0; node?.parentId && depth < 10; depth++) node = byId.get(node.parentId);
    return node ?? null;
  };

  const stages = new Map<string, Partial<Record<Stage, StageRow>>>();
  for (const row of stageRows) {
    const entry = stages.get(row.productId) ?? {};
    entry[row.stage] = row;
    stages.set(row.productId, entry);
  }

  const products = rows.map((row): EnrichProduct => {
    const supplier = row.supplierProduct ? renormalize(row.supplierProduct.data) : null;
    const category = row.categoryId ? byId.get(row.categoryId) : undefined;
    const root = rootOf(row.categoryId);
    const source: SourceFacts = supplier
      ? {
          name: supplier.name,
          description: supplier.description,
          brand: supplier.brand,
          sku: supplier.sku,
          attributes: supplier.attributes.map((attribute) => ({
            name: attribute.name,
            values: attribute.values.map((value) => value.text),
          })),
          images: supplier.images.map((image) => image.src),
          categoryExternalIds: supplier.categoryExternalIds,
        }
      : {
          name: row.name,
          description: row.description,
          brand: row.brand,
          sku: null,
          attributes: groupValues(row.attributeValues.map((v) => ({ name: v.attribute.name, value: v.value }))),
          images: row.images,
          categoryExternalIds: [],
        };
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      active: row.active,
      brand: row.brand,
      lockedFields: row.lockedFields,
      metadata: row.metadata,
      images: row.images,
      category: category && !category.deletedAt ? { id: category.id, slug: category.slug, name: category.name } : null,
      section: root && !root.deletedAt ? { id: root.id, slug: root.slug, name: root.name } : null,
      kind: kindOf(row.categoryId),
      supplierId: row.supplierProduct?.supplierId ?? null,
      supplierProductId: row.supplierProduct?.id ?? null,
      source,
      attributeValues: row.attributeValues.map((value) => ({
        attributeId: value.attributeId,
        slug: value.attribute.slug,
        name: value.attribute.name,
        unit: value.attribute.unit,
        value: value.value,
        numericValue: value.numericValue,
        source: value.source,
      })),
      stages: stages.get(row.id) ?? {},
    };
  });

  return {
    products,
    categories: categoryRows
      .filter((row) => !row.deletedAt)
      .map((row) => ({ id: row.id, slug: row.slug, name: row.name, parentId: row.parentId, kind: kindOf(row.id) })),
    imageAssets: new Map(assetRows.map((row) => [row.url, row])),
  };
}

function groupValues(values: Array<{ name: string; value: string }>): Array<{ name: string; values: string[] }> {
  const groups = new Map<string, string[]>();
  for (const { name, value } of values) groups.set(name, [...(groups.get(name) ?? []), value]);
  return [...groups].map(([name, list]) => ({ name, values: list }));
}

/**
 * What the research reads: the supplier's facts. Our own fields (name, description, category) are left out
 * on purpose, so publishing the pipeline's results does not make the product look changed. An admin who
 * moves a product to another kind of category asks for a re-run from the review page.
 */
export function extractInputsHash(product: EnrichProduct): string {
  return hashOf({ version: STAGE_VERSIONS.extract, source: product.source });
}

/** Products with the same supplier text are one family: researched together, from one datasheet. */
export function familyKey(product: EnrichProduct): string {
  const text = (product.source.description ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  if (text.length >= 80) return hashOf({ text }).slice(0, 16);
  return hashOf({ name: product.source.name.toLowerCase() }).slice(0, 16);
}
