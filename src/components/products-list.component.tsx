import { prismaGetProducts } from "@/actions/prisma-get-products.action";
import React from "react";
import ProductCard from "./product-card.component";

const ProductsList: React.FC = async () => {
  const result = await prismaGetProducts();

  if (!result.success) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600">Failed to load products: {result.error}</p>
      </div>
    );
  }

  if (result.data.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-600">No products available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {result.data.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductsList;
