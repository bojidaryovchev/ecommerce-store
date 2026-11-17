/**
 * Per-field overrides on supplier-synced products. When an admin edits one of these fields,
 * the field is "locked": the sync stops writing it and instead reports supplier changes to it
 * in the review queue. "Follow supplier again" removes the lock and restores the supplier value.
 */
export const LOCKABLE_PRODUCT_FIELDS = [
  "name",
  "description",
  "images",
  "categoryId",
  "brand",
  "price",
  "stock",
  "attributes",
] as const;

export type LockableProductField = (typeof LOCKABLE_PRODUCT_FIELDS)[number];

export const LOCKABLE_FIELD_LABELS: Record<LockableProductField, string> = {
  name: "Name",
  description: "Description",
  images: "Images",
  categoryId: "Category",
  brand: "Brand",
  price: "Price",
  stock: "Availability",
  attributes: "Specifications",
};

export function isLockableField(value: string): value is LockableProductField {
  return (LOCKABLE_PRODUCT_FIELDS as readonly string[]).includes(value);
}

type EditableProductFields = {
  name: string;
  description: string | null;
  images: string[];
  categoryId: string | null;
  brand: string | null;
  trackInventory: boolean;
  stockQuantity: number | null;
};

const sameList = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((v, i) => v === b[i]);

/**
 * Which lockable fields an admin edit changes. Fields missing from the patch (undefined)
 * are not being edited.
 */
export function editedLockableFields(
  current: EditableProductFields,
  patch: Partial<{ [K in keyof EditableProductFields]: EditableProductFields[K] | null | undefined }>,
): LockableProductField[] {
  const edited: LockableProductField[] = [];
  const norm = (value: string | null | undefined) => (value ?? "").trim();

  if (patch.name !== undefined && norm(patch.name) !== norm(current.name)) edited.push("name");
  if (patch.description !== undefined && norm(patch.description) !== norm(current.description)) {
    edited.push("description");
  }
  if (patch.images !== undefined && !sameList(patch.images ?? [], current.images)) edited.push("images");
  if (patch.categoryId !== undefined && (patch.categoryId || null) !== current.categoryId) edited.push("categoryId");
  if (patch.brand !== undefined && norm(patch.brand) !== norm(current.brand)) edited.push("brand");
  const stockEdited =
    (patch.trackInventory !== undefined && patch.trackInventory !== current.trackInventory) ||
    (patch.stockQuantity !== undefined && (patch.stockQuantity ?? null) !== current.stockQuantity);
  if (stockEdited) edited.push("stock");
  return edited;
}

export function addLocks(lockedFields: readonly string[], fields: readonly LockableProductField[]): string[] {
  return [...new Set([...lockedFields, ...fields])];
}
