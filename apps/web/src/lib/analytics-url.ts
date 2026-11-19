/**
 * What of a page's URL the visit statistics may keep (components/common/site-analytics.tsx).
 *
 * A visitor's own pages (account, orders) are not counted at all. Of the query only what shows a catalog or
 * form page is kept: the search, the filters, the sort, the page, the products compared, the contact topic.
 * A payment session, a sign-in or reset token or a return address never reaches the numbers.
 */
const KEPT = new Set([
  "q",
  "category",
  "brand",
  "minPrice",
  "maxPrice",
  "inStock",
  "sort",
  "page",
  "p",
  "tema",
  "sistema",
  "produkt",
]);
const KEPT_PREFIXES = ["f.", "r."];
const PRIVATE = /^\/(?:en\/)?account(?:\/|$)/;

/** The URL as the statistics may record it, or null when the page is not counted. */
export function analyticsUrl(href: string): string | null {
  const url = new URL(href);
  if (PRIVATE.test(url.pathname)) return null;
  for (const key of [...url.searchParams.keys()]) {
    if (!KEPT.has(key) && !KEPT_PREFIXES.some((prefix) => key.startsWith(prefix))) url.searchParams.delete(key);
  }
  url.hash = "";
  return url.toString();
}
