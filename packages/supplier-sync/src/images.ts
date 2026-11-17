import type { NormalizedImage } from "./normalize/product";

/**
 * Decides which URL we store for a supplier image. The default keeps the supplier's URL;
 * an implementation that copies images to our own storage (keyed by the supplier's image id)
 * can be passed to the sync without other changes.
 */
export interface ImageStore {
  resolve(image: NormalizedImage, supplierSlug: string): Promise<string>;
}

export const supplierHostedImages: ImageStore = {
  resolve: async (image) => image.src,
};

export async function resolveImages(
  store: ImageStore,
  images: readonly NormalizedImage[],
  supplierSlug: string,
): Promise<string[]> {
  const urls: string[] = [];
  for (const image of images) urls.push(await store.resolve(image, supplierSlug));
  return urls;
}
