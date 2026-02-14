import { ProductsGrid } from "@/components/products";
import { auth } from "@/lib/auth";
import { getFeaturedProducts } from "@/queries/products";
import { getWishlistProductIds } from "@/queries/wishlist";
import React from "react";

interface Props {
  count?: number;
}

const FeaturedProducts: React.FC<Props> = async ({ count = 8 }) => {
  const [products, session] = await Promise.all([getFeaturedProducts(count), auth()]);
  const wishlistedProductIds = session?.user?.id ? await getWishlistProductIds(session.user.id) : undefined;

  return <ProductsGrid products={products} wishlistedProductIds={wishlistedProductIds} />;
};

export { FeaturedProducts };
