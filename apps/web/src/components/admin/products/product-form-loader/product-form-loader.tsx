import { getCategories } from "@/queries/categories";
import { getProductById } from "@/queries/products";
import { notFound } from "next/navigation";
import React from "react";
import { ProductForm } from "./product-form";

interface Props {
  productId?: string;
}

const ProductFormLoader: React.FC<Props> = async ({ productId }) => {
  const { data: categories } = await getCategories({ pageSize: 200 });

  if (productId) {
    const product = await getProductById(productId);

    if (!product) {
      notFound();
    }

    return <ProductForm product={product} categories={categories} />;
  }

  return <ProductForm categories={categories} />;
};

export { ProductFormLoader };
