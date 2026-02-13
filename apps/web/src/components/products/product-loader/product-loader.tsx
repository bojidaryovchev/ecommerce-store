import { ProductDetail } from "@/components/products";
import { getProductById } from "@/queries/products";
import { notFound } from "next/navigation";
import React from "react";

interface Props {
  productId: string;
}

const ProductLoader: React.FC<Props> = async ({ productId }) => {
  const product = await getProductById(productId);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
};

export { ProductLoader };
