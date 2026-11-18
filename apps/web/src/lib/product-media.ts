import type { ProductMedia } from "@ecommerce/database/schema";

/**
 * A product's photos: what its gallery and every thumbnail show. The supplier's image list mixes photos with
 * feature icons, badges and spec tables; `product.media` (derived from the enrichment's image classification)
 * keeps them apart. Until it exists, the images are shown as they come.
 */
export function productPhotos(product: { images?: string[] | null; media?: ProductMedia | null }): string[] {
  return product.media?.photos?.length ? product.media.photos : (product.images ?? []);
}

/** The photo that stands for a product on cards, in the cart, in search suggestions and at checkout. */
export function primaryPhoto(product: { images?: string[] | null; media?: ProductMedia | null }): string | null {
  return productPhotos(product)[0] ?? null;
}
