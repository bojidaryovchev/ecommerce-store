/**
 * Storefront URLs (without the /en prefix; the i18n Link adds it). Keep every product and
 * category link going through these so the URL scheme lives in one place.
 */

/** /produkt/{slug}; products created before slugs existed fall back to their old id URL, which redirects. */
export function productHref(product: { id: string; slug: string | null }): string {
  return product.slug ? `/produkt/${product.slug}` : `/products/${product.id}`;
}

/** A category page from its trail (root first, the category last): /peletni-kamini/s-vodna-riza. */
export function categoryHref(trail: ReadonlyArray<{ slug: string }>): string {
  return trail.length > 0 ? `/${trail.map((category) => category.slug).join("/")}` : "/categories";
}
