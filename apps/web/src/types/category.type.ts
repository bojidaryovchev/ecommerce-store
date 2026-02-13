import type { ProductWithPrices } from "@/types/product.type";
import type { Category } from "@ecommerce/database/schema";

export type { ProductWithPrices };

export type CategoryWithChildren = Category & {
  children: Category[];
};

export type CategoryWithParent = Category & {
  parent: Category | null;
};

export type CategoryWithProducts = Category & {
  products: ProductWithPrices[];
};

export type CategoryWithProductsAndChildren = Category & {
  products: ProductWithPrices[];
  children: Category[];
  parent: Category | null;
};

export type CategoryTree = Category & {
  children: CategoryTree[];
};
