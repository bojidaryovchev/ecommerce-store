export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  image?: string | null;
};

/** The category's ancestors from the root down, followed by the category itself. */
export function categoryTrail<T extends CategoryNode>(categories: readonly T[], id: string | null | undefined): T[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const trail: T[] = [];
  const seen = new Set<string>();
  let current = id ? byId.get(id) : undefined;
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    trail.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return trail;
}

export type CategoryTile = {
  id: string;
  name: string;
  slug: string;
  href: string;
  /** The category's own picture, else a photo of its flagship product. */
  image: string | null;
  /** Whether `image` is a photo of a scene (category picture) or of a product on white. */
  imageKind: "scene" | "product" | null;
  productCount: number;
  /** Lowest price in the subtree, in cents. */
  minPrice: number | null;
};

export type CategoryMenuItem = CategoryTile & { children: CategoryTile[] };

type Stats = Record<string, { productCount: number; minPrice: number | null; sampleImage: string | null }>;

function tile(category: CategoryNode, href: string, stats: Stats): CategoryTile {
  const own = stats[category.id];
  const image = category.image ?? own?.sampleImage ?? null;
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    href,
    image,
    imageKind: category.image ? "scene" : image ? "product" : null,
    productCount: own?.productCount ?? 0,
    minPrice: own?.minPrice ?? null,
  };
}

/**
 * Top-level categories with their direct subcategories, their URLs and what they hold, for the
 * products menu and the category tiles. Categories with nothing in them are left out.
 */
export function buildCategoryMenu(
  categories: readonly CategoryNode[],
  href: (trail: CategoryNode[]) => string,
  stats: Stats = {},
): CategoryMenuItem[] {
  const counted = Object.keys(stats).length > 0;
  const hasProducts = (category: CategoryNode) => !counted || (stats[category.id]?.productCount ?? 0) > 0;
  const roots = categories.filter((category) => category.parentId === null && hasProducts(category));
  return roots.map((root) => ({
    ...tile(root, href([root]), stats),
    children: categories
      .filter((category) => category.parentId === root.id && hasProducts(category))
      .map((child) => tile(child, href([root, child]), stats)),
  }));
}
