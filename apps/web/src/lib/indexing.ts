/**
 * Whether search engines may index the site: only once SITE_INDEXING=on is set for the production build.
 *
 * Off until launch, on purpose. The product descriptions are still the supplier's own text, and a
 * search engine meeting a copy of somebody else's catalogue would judge the domain by it before it has
 * anything of its own. While off:
 *   - every response carries `X-Robots-Tag: noindex, nofollow` (next.config.ts);
 *   - every page's robots meta says noindex (app/[locale]/layout.tsx);
 *   - robots.txt still allows crawling, so crawlers can read the noindex, but does not list the sitemap.
 * Once on, a product page whose text is still the supplier's stays noindex and out of the sitemap until its own
 * copy is published (lib/product-indexing.ts).
 */
export const SITE_INDEXABLE = process.env.SITE_INDEXING === "on";
