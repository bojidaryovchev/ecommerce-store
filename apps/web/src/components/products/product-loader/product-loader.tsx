import { ProductDetail } from "@/components/products";
import { auth } from "@/lib/auth";
import { getProductById } from "@/queries/products";
import { isProductWishlisted } from "@/queries/wishlist";
import { notFound } from "next/navigation";
import React from "react";

interface Props {
  productId: string;
}

const ProductLoader: React.FC<Props> = async ({ productId }) => {
  const [product, session] = await Promise.all([getProductById(productId), auth()]);

  if (!product) {
    notFound();
  }

  const wishlisted = session?.user?.id ? await isProductWishlisted(session.user.id, productId) : undefined;

  return <ProductDetail product={product} isWishlisted={wishlisted} />;
};

export { ProductLoader };
