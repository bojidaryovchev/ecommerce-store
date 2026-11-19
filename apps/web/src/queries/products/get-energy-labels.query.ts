"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { ENERGY_ATTRIBUTE_SLUGS, energyLabelOf, type EnergyLabelView } from "@/lib/energy-label";
import { db, schema } from "@ecommerce/database";
import { eq, inArray } from "drizzle-orm";
import { cacheTag } from "next/cache";

/**
 * Every live product's energy label as listings show it next to the price (lib/energy-label.ts), by product id:
 * only the products with a label to show are in it, so it stays small, and every card reads the one cached map.
 */
async function getEnergyLabels(): Promise<Record<string, EnergyLabelView>> {
  cacheTag(CACHE_TAGS.products, CACHE_TAGS.categories);

  const energyAttributes = db
    .select({ id: schema.attributes.id })
    .from(schema.attributes)
    .where(inArray(schema.attributes.slug, [...ENERGY_ATTRIBUTE_SLUGS]));
  const [products, categories] = await Promise.all([
    db.query.products.findMany({
      where: eq(schema.products.active, true),
      columns: { id: true, media: true, metadata: true, categoryId: true },
      with: {
        attributeValues: {
          where: inArray(schema.productAttributeValues.attributeId, energyAttributes),
          columns: { value: true, numericValue: true },
          with: { attribute: { columns: { slug: true } } },
        },
      },
    }),
    db.query.categories.findMany({ columns: { id: true, slug: true, parentId: true } }),
  ]);

  const byId = new Map(categories.map((category) => [category.id, category]));
  /** The category and its ancestors, nearest first. */
  const trail = (id: string | null) => {
    const slugs: string[] = [];
    let node = id ? byId.get(id) : undefined;
    for (let depth = 0; node && depth < 10; depth++) {
      slugs.push(node.slug);
      node = node.parentId ? byId.get(node.parentId) : undefined;
    }
    return slugs;
  };

  const labels: Record<string, EnergyLabelView> = {};
  for (const product of products) {
    if (product.attributeValues.length === 0) continue;
    const view = energyLabelOf(
      product,
      trail(product.categoryId),
      product.attributeValues.map((value) => ({
        slug: value.attribute.slug,
        value: value.value,
        numericValue: value.numericValue,
      })),
    );
    if (view) labels[product.id] = view;
  }
  return labels;
}

export { getEnergyLabels };
