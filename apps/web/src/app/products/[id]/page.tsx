import { ProductDetailSkeleton } from "@/components/common";
import { ProductLoader } from "@/components/products";
import { getProductById, getProducts } from "@/queries/products";
import type { Metadata } from "next";
import React, { Suspense } from "react";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return {
      title: "Product Not Found | Ecommerce Store",
    };
  }

  return {
    title: `${product.name} | Ecommerce Store`,
    description: product.description ?? `View details of ${product.name}`,
  };
}

export async function generateStaticParams() {
  const products = await getProducts();

  return products.map((product) => ({
    id: product.id,
  }));
}

const ProductPage: React.FC<Props> = async ({ params }) => {
  const { id } = await params;

  return (
    <main className="max-w-container py-8">
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductLoader productId={id} />
      </Suspense>
    </main>
  );
};

export default ProductPage;
