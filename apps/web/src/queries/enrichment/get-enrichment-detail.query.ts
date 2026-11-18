import { db, schema } from "@ecommerce/database";
import { readClassify, readExtract, readReview, readRewrite, readValidate } from "@ecommerce/supplier-sync/enrich";
import { asc, eq, inArray } from "drizzle-orm";
import { connection } from "next/server";

/**
 * One product's proposal next to what the shop shows now: the before and after of the review page.
 * Always fresh (admin use).
 */
async function getEnrichmentDetail(productId: string) {
  await connection();
  const product = await db.query.products.findFirst({
    where: eq(schema.products.id, productId),
    with: {
      category: { columns: { id: true, name: true, slug: true } },
      attributeValues: { orderBy: [asc(schema.productAttributeValues.sortOrder)], with: { attribute: true } },
      supplierProduct: { columns: { permalink: true, name: true } },
      enrichments: true,
    },
  });
  if (!product) return null;

  const stage = (name: string) => product.enrichments.find((row) => row.stage === name) ?? null;
  const assets = product.images.length
    ? await db.select().from(schema.imageAssets).where(inArray(schema.imageAssets.url, product.images))
    : [];
  const kindByUrl = new Map(assets.map((asset) => [asset.url, asset]));

  return {
    product: {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      metaDescription: product.metadata.metaDescription ?? null,
      active: product.active,
      lockedFields: product.lockedFields,
      category: product.category,
      supplierUrl: product.supplierProduct?.permalink ?? null,
      attributes: product.attributeValues.map((value) => ({
        slug: value.attribute.slug,
        name: value.attribute.name,
        value: value.value,
        source: value.source,
      })),
      images: product.images.map((url) => ({
        url,
        kind: kindByUrl.get(url)?.kind ?? null,
        label: kindByUrl.get(url)?.label ?? null,
      })),
    },
    stages: {
      extract: stage("extract"),
      validate: stage("validate"),
      classify: stage("classify"),
      rewrite: stage("rewrite"),
      review: stage("review"),
      publish: stage("publish"),
    },
    extract: readExtract(stage("extract")?.output),
    validate: readValidate(stage("validate")?.output),
    classify: readClassify(stage("classify")?.output),
    rewrite: readRewrite(stage("rewrite")?.output),
    review: readReview(stage("review")?.output),
  };
}

export type EnrichmentDetail = NonNullable<Awaited<ReturnType<typeof getEnrichmentDetail>>>;

export { getEnrichmentDetail };
