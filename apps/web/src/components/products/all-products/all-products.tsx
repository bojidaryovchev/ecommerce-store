import { ProductsGrid } from "@/components/products";
import { auth } from "@/lib/auth";
import { getProducts } from "@/queries/products";
import { getWishlistProductIds } from "@/queries/wishlist";
import React from "react";

const AllProducts: React.FC = async () => {
  const [products, session] = await Promise.all([getProducts(), auth()]);
  const wishlistedProductIds = session?.user?.id ? await getWishlistProductIds(session.user.id) : undefined;

  return <ProductsGrid products={products} wishlistedProductIds={wishlistedProductIds} />;
};

export { AllProducts };
