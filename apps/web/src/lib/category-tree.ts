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

export type CategoryMenuItem = {
  id: string;
  name: string;
  href: string;
  children: Array<{ id: string; name: string; href: string }>;
};

/** Top-level categories with their direct subcategories and their URLs, for the navigation menu. */
export function buildCategoryMenu(
  categories: readonly CategoryNode[],
  href: (trail: CategoryNode[]) => string,
): CategoryMenuItem[] {
  const roots = categories.filter((category) => category.parentId === null);
  return roots.map((root) => ({
    id: root.id,
    name: root.name,
    href: href([root]),
    children: categories
      .filter((category) => category.parentId === root.id)
      .map((child) => ({ id: child.id, name: child.name, href: href([root, child]) })),
  }));
}
