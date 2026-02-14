import type { Category, Price, Product, Review } from "@ecommerce/database/schema";

export type ProductWithPrices = Product & {
  prices: Price[];
};

export type ProductWithCategory = Product & {
  category: Category | null;
};

export type ProductWithPricesAndCategory = Product & {
  prices: Price[];
  category: Category | null;
};

export type ProductWithDetails = Product & {
  prices: Price[];
  category: Category | null;
  reviews: Review[];
};

export type ProductFormData = {
  name: string;
  description?: string | null;
  active?: boolean;
  images?: string[] | null;
  categoryId?: string | null;
  shippable?: boolean | null;
  trackInventory?: boolean;
  stockQuantity?: number | null;
  taxCode?: string | null;
  unitLabel?: string | null;
  url?: string | null;
  statementDescriptor?: string | null;
  metadata?: Record<string, string> | null;
  marketingFeatures?: Array<{ name?: string }> | null;
  packageDimensions?: {
    height?: number;
    length?: number;
    weight?: number;
    width?: number;
  } | null;
};

export type PriceFormData = {
  productId: string;
  currency?: string;
  unitAmount?: number | null;
  type?: "one_time" | "recurring";
  active?: boolean;
  nickname?: string | null;
  metadata?: Record<string, string> | null;
};
