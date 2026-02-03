import ProductDetail from "@/components/product-detail.component";
import { getProductById, getProducts } from "@/lib/queries/products";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
    <main className="container mx-auto px-4 py-8">
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetailLoader id={id} />
      </Suspense>
    </main>
  );
};

interface LoaderProps {
  id: string;
}

const ProductDetailLoader: React.FC<LoaderProps> = async ({ id }) => {
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
};

const ProductDetailSkeleton: React.FC = () => {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="bg-muted aspect-square animate-pulse rounded-lg" />
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="bg-muted h-8 w-3/4 animate-pulse rounded" />
          <div className="bg-muted h-6 w-1/4 animate-pulse rounded" />
        </div>
        <div className="space-y-2">
          <div className="bg-muted h-4 w-full animate-pulse rounded" />
          <div className="bg-muted h-4 w-full animate-pulse rounded" />
          <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
        </div>
        <div className="bg-muted h-12 w-full animate-pulse rounded" />
      </div>
    </div>
  );
};

export default ProductPage;
