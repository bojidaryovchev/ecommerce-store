import { SupplierProductPanel } from "@/components/admin/supplier-sync";
import { getCategories } from "@/queries/categories";
import { getProductById } from "@/queries/products";
import { getProductSupplierLink } from "@/queries/supplier-sync";
import { notFound } from "next/navigation";
import React from "react";
import { ProductForm } from "./product-form";

interface Props {
  productId?: string;
}

const ProductFormLoader: React.FC<Props> = async ({ productId }) => {
  const { data: categories } = await getCategories({ pageSize: 200 });

  if (productId) {
    const [product, supplierLink] = await Promise.all([getProductById(productId), getProductSupplierLink(productId)]);

    if (!product) {
      notFound();
    }

    return (
      <div className="space-y-6">
        {supplierLink && (
          <SupplierProductPanel productId={product.id} lockedFields={product.lockedFields} link={supplierLink} />
        )}
        <ProductForm product={product} categories={categories} />
      </div>
    );
  }

  return <ProductForm categories={categories} />;
};

export { ProductFormLoader };
