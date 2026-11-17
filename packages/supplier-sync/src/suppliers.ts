export type SupplierConfig = {
  slug: string;
  name: string;
  baseUrl: string;
  platform: "woocommerce";
};

/** Suppliers we can sync. Adding one = a new entry here (and a new client if it isn't WooCommerce). */
export const SUPPLIERS = {
  hydroterm: {
    slug: "hydroterm",
    name: "Хидро Терм",
    baseUrl: "https://hydrotermbg.com",
    platform: "woocommerce",
  },
} as const satisfies Record<string, SupplierConfig>;

export type SupplierSlug = keyof typeof SUPPLIERS;

export const DEFAULT_SUPPLIER: SupplierSlug = "hydroterm";

export function isSupplierSlug(value: string): value is SupplierSlug {
  return Object.hasOwn(SUPPLIERS, value);
}

export function getSupplierConfig(slug: string): SupplierConfig {
  if (!isSupplierSlug(slug)) {
    throw new Error(`Unknown supplier "${slug}". Known: ${Object.keys(SUPPLIERS).join(", ")}`);
  }
  return SUPPLIERS[slug];
}
