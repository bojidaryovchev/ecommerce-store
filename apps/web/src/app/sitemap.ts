import { guideHref, GUIDES } from "@/content/guides";
import { INFO_SLUGS, infoHref, WITHDRAWAL_HREF } from "@/content/legal";
import { TOOLS } from "@/lib/calculators";
import { categoryTrail } from "@/lib/category-tree";
import { INSTALLATION_SYSTEMS, installationHref } from "@/lib/installation-systems";
import { categoryHref, productHref } from "@/lib/routes";
import { SITE_URL } from "@/lib/site-url";
import { getCategoryIndex } from "@/queries/categories";
import { getProducts } from "@/queries/products";
import type { MetadataRoute } from "next";

/**
 * Bulgarian URLs are listed, with English alternates for pages whose content exists in English (the
 * site's own pages); product and category content is Bulgarian-only for now.
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
    // Listings of Bulgarian product content: the English versions are not indexed.
    { ...page("/products", false), changeFrequency: "daily", priority: 0.8 },
    { ...page("/categories", false), changeFrequency: "weekly", priority: 0.7 },
    { ...page(installationHref(), true), changeFrequency: "monthly", priority: 0.8 },
    ...INSTALLATION_SYSTEMS.map((system) => ({
      ...page(installationHref(system.slug), true),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { ...page(guideHref(), true), changeFrequency: "weekly", priority: 0.6 },
    ...GUIDES.map((guide) => ({
      ...page(guideHref(guide.slug), true),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { ...page("/kalkulatori", true), changeFrequency: "monthly", priority: 0.5 },
    ...TOOLS.map((tool) => ({
      ...page(`/kalkulatori/${tool}`, true),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    { ...page("/kontakti", true), changeFrequency: "yearly", priority: 0.5 },
    ...[...INFO_SLUGS.map(infoHref), WITHDRAWAL_HREF].map((path) => ({
      ...page(path, true),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
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
