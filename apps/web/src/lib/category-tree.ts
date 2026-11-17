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
