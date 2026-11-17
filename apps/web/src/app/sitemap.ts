import { categoryTrail } from "@/lib/category-tree";
import { categoryHref, productHref } from "@/lib/routes";
import { SITE_URL } from "@/lib/site-url";
import { getCategoryIndex } from "@/queries/categories";
import { getProducts } from "@/queries/products";
import type { MetadataRoute } from "next";

/**
 * Bulgarian URLs are canonical. English alternates are listed only for pages whose content exists
 * in English (the UI pages); product and category content is Bulgarian-only for now.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getProducts(), getCategoryIndex()]);

  const page = (path: string, withEnglish: boolean): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${path}`,
    ...(withEnglish && {
      alternates: { languages: { bg: `${SITE_URL}${path}`, en: `${SITE_URL}/en${path === "/" ? "" : path}` } },
    }),
  });

  return [
    { ...page("/", true), changeFrequency: "daily", priority: 1 },
    { ...page("/products", true), changeFrequency: "daily", priority: 0.8 },
    { ...page("/categories", true), changeFrequency: "weekly", priority: 0.7 },
    ...categories.map((category) => ({
      ...page(categoryHref(categoryTrail(categories, category.id)), false),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      ...page(productHref(product), false),
      lastModified: product.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
  ];
}
