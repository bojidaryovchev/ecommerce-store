import type { Category, Price, Product } from "@ecommerce/database/schema";

export type CategoryWithChildren = Category & {
  children: Category[];
};

export type CategoryWithParent = Category & {
  parent: Category | null;
};

export type CategoryWithProducts = Category & {
  products: ProductWithPrices[];
};

export type ProductWithPrices = Product & {
  prices: Price[];
};

export type CategoryWithProductsAndChildren = Category & {
  products: ProductWithPrices[];
  children: Category[];
  parent: Category | null;
};

export type CategoryTree = Category & {
  children: CategoryTree[];
};
