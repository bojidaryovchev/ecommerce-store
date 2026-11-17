export { CATEGORY_TREES, HYDROTERM_CATEGORY_TREE, type CuratedCategory } from "./curation";
export { supplierHostedImages, type ImageStore } from "./images";
export {
  LOCKABLE_FIELD_LABELS,
  LOCKABLE_PRODUCT_FIELDS,
  addLocks,
  editedLockableFields,
  isLockableField,
  type LockableProductField,
} from "./locks";
export { consoleLogger, silentLogger, type Logger } from "./logger";
export { normalizeWooProduct, type NormalizedProduct } from "./normalize/product";
export { slugify, transliterateBg } from "./normalize/transliterate";
export { DEFAULT_SUPPLIER, SUPPLIERS, getSupplierConfig, isSupplierSlug, type SupplierSlug } from "./suppliers";
export { applyCategoryTree, type ApplyCategoryTreeResult } from "./sync/curation";
export {
  SyncReviewError,
  applySyncChange,
  dismissSyncChange,
  followSupplierForField,
  publishAllNewProducts,
} from "./sync/review";
export {
  runSupplierSync,
  type RunSupplierSyncOptions,
  type SyncMode,
  type SyncRunResult,
  type SyncTrigger,
} from "./sync/run";
export { uniqueProductSlug } from "./sync/shared";
export type { Database } from "./types";
