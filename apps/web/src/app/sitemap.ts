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

type Entry = MetadataRoute.Sitemap[number];
type Extra = Omit<Entry, "url" | "alternates">;

/**
 * Every indexable URL. A page whose content exists in both languages is listed in each, and each
 * entry names both versions and the Bulgarian x-default (Google wants every version under its own
 * <url>). Product and category content is Bulgarian only, so those are listed once.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getProducts(), getCategoryIndex()]);

  const bilingual = (path: string, extra: Extra): Entry[] => {
    const bg = `${SITE_URL}${path}`;
    const en = `${SITE_URL}/en${path === "/" ? "" : path}`;
    const alternates = { languages: { bg, en, "x-default": bg } };
    return [
      { url: bg, alternates, ...extra },
      { url: en, alternates, ...extra },
    ];
  };
  const bulgarian = (path: string, extra: Extra): Entry => ({ url: `${SITE_URL}${path}`, ...extra });

  return [
    ...bilingual("/", { changeFrequency: "daily", priority: 1 }),
    // Listings of Bulgarian product content: the English versions are not indexed.
    bulgarian("/products", { changeFrequency: "daily", priority: 0.8 }),
    bulgarian("/categories", { changeFrequency: "weekly", priority: 0.7 }),
    ...bilingual(installationHref(), { changeFrequency: "monthly", priority: 0.8 }),
    ...INSTALLATION_SYSTEMS.flatMap((system) =>
      bilingual(installationHref(system.slug), { changeFrequency: "monthly", priority: 0.8 }),
    ),
    ...bilingual(guideHref(), { changeFrequency: "weekly", priority: 0.6 }),
    ...GUIDES.flatMap((guide) =>
      bilingual(guideHref(guide.slug), {
        lastModified: guide.updated,
        changeFrequency: "monthly",
        priority: 0.6,
      }),
    ),
    ...bilingual("/kalkulatori", { changeFrequency: "monthly", priority: 0.5 }),
    ...TOOLS.flatMap((tool) => bilingual(`/kalkulatori/${tool}`, { changeFrequency: "monthly", priority: 0.5 })),
    ...bilingual("/kontakti", { changeFrequency: "yearly", priority: 0.5 }),
    ...[...INFO_SLUGS.map(infoHref), WITHDRAWAL_HREF].flatMap((path) =>
      bilingual(path, { changeFrequency: "yearly", priority: 0.3 }),
    ),
    ...categories.map((category) =>
      bulgarian(categoryHref(categoryTrail(categories, category.id)), { changeFrequency: "weekly", priority: 0.7 }),
    ),
    ...products.map((product) =>
      bulgarian(productHref(product), {
        lastModified: product.updatedAt,
        changeFrequency: "daily",
        priority: 0.6,
        // The photos, so image search finds them through the page they belong to.
        images: (product.images ?? [])
          .slice(0, 10)
          .map((image) => (image.startsWith("http") ? image : `${SITE_URL}${image}`)),
      }),
    ),
  ];
}
