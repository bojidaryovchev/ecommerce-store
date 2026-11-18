/**
 * Whether a product page's text is the shop's own, which its indexing depends on.
 *
 * A supplier's product shows the supplier's text until its rewritten copy is published; publishing locks
 * `description` (supplier-sync's enrichment, docs/enrichment.md). Until then the page is a copy of somebody
 * else's catalogue, so it stays out of the index and the sitemap even once SITE_INDEXING is on. A product of our
 * own (no supplier row) is ours from the start.
 *
 * `supplierProduct` is required on purpose: a query that forgot to load it must not make every page indexable.
 */
export function hasOwnCopy(product: { lockedFields: string[]; supplierProduct: { id: string } | null }): boolean {
  return product.supplierProduct === null || product.lockedFields.includes("description");
}
