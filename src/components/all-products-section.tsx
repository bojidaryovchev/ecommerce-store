import { getProducts } from "@/actions/get-products.action";
import React from "react";
import { ProductCard } from "./product-card";

const AllProductsSection: React.FC = async () => {
  const products = await getProducts();

  if (!products.success) {
    return null;
  }

  return (
    <>
      {/* All Products */}
      <section className="container mx-auto border-t px-4 py-12 md:py-16">
        <div className="mb-8">
          <h2 className="mb-2 text-3xl font-bold">All Products</h2>
          <p className="text-muted-foreground">Browse our complete collection of sustainable products</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.data.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </>
  );
};

export default AllProductsSection;
