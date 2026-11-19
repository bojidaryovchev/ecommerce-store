import type { ProductMedia } from "@ecommerce/database/schema";
import * as schema from "@ecommerce/database/schema";
import { and, eq, inArray } from "drizzle-orm";
import { stableStringify } from "./normalize/product";
import type { DbExecutor } from "./types";

/**
 * What a product's images are for. The supplier's image list mixes product photos with feature icons,
 * certification badges, energy labels, spec tables and drawings; the enrichment classifies each image
 * (image_asset, shared per URL) and says per product which photos show a different model of the range.
 * From that, a gallery shows photos only, icons and badges become small labelled chips, and tables, drawings
 * and energy labels get their own place. Kept in `product.media`; null means "not derived yet: show images as they are".
 */

type ImageKind = (typeof schema.imageKindEnum.enumValues)[number];
type Known = { kind: ImageKind; label: string | null; width?: number | null; height?: number | null };

/**
 * Whether an "energy label" image is the EU label itself, which is a tall portrait sheet, rather than a class badge
 * (a small "A++" graphic): only the label meets the display rules when the class arrow opens it.
 */
const isWholeLabel = (known: Known) =>
  typeof known.width === "number" &&
  typeof known.height === "number" &&
  known.height >= 300 &&
  known.height >= known.width * 1.4;

// An energy label is not a chip: "A++" next to "A+++" says nothing without the water temperature each is for,
// so the labels are shown whole, with the tables and drawings.
const CHIP_KINDS = new Set<ImageKind>(["icon", "badge"]);
const DRAWING_KINDS = new Set<ImageKind>(["spec_table", "diagram", "energy_label"]);

export function deriveMedia(
  images: readonly string[],
  kinds: ReadonlyMap<string, Known>,
  otherModel: ReadonlySet<string> = new Set(),
): ProductMedia {
  const photos: string[] = [];
  const rangePhotos: string[] = [];
  const chips: ProductMedia["chips"] = [];
  const drawings: string[] = [];
  const energyLabels: string[] = [];
  const labels = new Set<string>();

  for (const url of images) {
    const known = kinds.get(url);
    // An image nobody classified yet is taken for a photo, as it was shown before.
    if (!known || known.kind === "photo") {
      (otherModel.has(url) ? rangePhotos : photos).push(url);
    } else if (CHIP_KINDS.has(known.kind)) {
      const key = (known.label ?? url).trim().toLowerCase();
      if (labels.has(key)) continue;
      labels.add(key);
      chips.push({ url, kind: known.kind as ProductMedia["chips"][number]["kind"], label: known.label });
    } else if (DRAWING_KINDS.has(known.kind)) {
      drawings.push(url);
      // The energy label also opens from the class arrow next to the price (energy-label.ts).
      if (known.kind === "energy_label" && isWholeLabel(known)) energyLabels.push(url);
    }
    // Logos and anything else stay out.
  }

  // Never an empty gallery: photos of the range's other sizes before nothing at all.
  if (photos.length === 0) photos.push(...rangePhotos);
  if (photos.length === 0 && images[0]) photos.push(images[0]);
  return { photos, chips, drawings, labels: energyLabels };
}

/**
 * Derives `media` again for the given products (all when none are given) and stores it where it changed.
 * Returns the ids of the products whose media changed, for cache revalidation.
 */
export async function refreshProductMedia(db: DbExecutor, productIds?: readonly string[]): Promise<string[]> {
  if (productIds && productIds.length === 0) return [];
  const products = await db
    .select({ id: schema.products.id, images: schema.products.images, media: schema.products.media })
    .from(schema.products)
    .where(productIds ? inArray(schema.products.id, [...productIds]) : undefined);
  const urls = [...new Set(products.flatMap((product) => product.images))];
  const [assets, classified] = await Promise.all([
    urls.length > 0
      ? db
          .select({
            url: schema.imageAssets.url,
            kind: schema.imageAssets.kind,
            label: schema.imageAssets.label,
            width: schema.imageAssets.width,
            height: schema.imageAssets.height,
          })
          .from(schema.imageAssets)
          .where(inArray(schema.imageAssets.url, urls))
      : Promise.resolve([]),
    db
      .select({ productId: schema.productEnrichments.productId, output: schema.productEnrichments.output })
      .from(schema.productEnrichments)
      .where(
        and(
          eq(schema.productEnrichments.stage, "classify"),
          productIds ? inArray(schema.productEnrichments.productId, [...productIds]) : undefined,
        ),
      ),
  ]);
  const kinds = new Map(assets.map((asset) => [asset.url, { kind: asset.kind, label: asset.label }]));
  const otherModelByProduct = new Map<string, Set<string>>();
  for (const row of classified) {
    const images = (row.output as { images?: Array<{ url?: unknown; otherModel?: unknown }> } | null)?.images ?? [];
    otherModelByProduct.set(
      row.productId,
      new Set(
        images
          .filter((image) => image.otherModel === true && typeof image.url === "string")
          .map((image) => image.url as string),
      ),
    );
  }

  const changed: string[] = [];
  for (const product of products) {
    const media = deriveMedia(product.images, kinds, otherModelByProduct.get(product.id));
    if (product.media && stableStringify(product.media) === stableStringify(media)) continue;
    await db.update(schema.products).set({ media }).where(eq(schema.products.id, product.id));
    changed.push(product.id);
  }
  return changed;
}
