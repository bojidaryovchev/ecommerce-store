"use client";

import type { Product } from "@/actions/get-products.action";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { calculateDiscountPercentage, formatPrice, getStockStatus } from "@/lib/product-utils";
import { Edit, Package } from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useState } from "react";
import EditProductModal from "./edit-product-modal";

interface ProductsListProps {
  products: Product[];
}

const ProductsList: React.FC<ProductsListProps> = ({ products }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setEditModalOpen(true);
  };

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <Package className="text-muted-foreground mb-4 h-12 w-12" />
        <h3 className="mb-2 text-lg font-semibold">No products yet</h3>
        <p className="text-muted-foreground mb-4 text-sm">Get started by creating your first product</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => {
          const stockStatus = getStockStatus(product.stockQuantity, product.lowStockThreshold);
          const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
          const discountPercentage = hasDiscount
            ? calculateDiscountPercentage(product.compareAtPrice!, product.price)
            : 0;

          return (
            <Card
              key={product.id}
              className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg"
              onClick={() => handleProductClick(product)}
            >
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                {product.images[0] ? (
                  <Image
                    src={product.images[0].url}
                    alt={product.images[0].alt || product.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="text-muted-foreground h-16 w-16" />
                  </div>
                )}

                {/* Featured Badge */}
                {product.isFeatured && (
                  <div className="absolute top-2 left-2 rounded-full bg-yellow-500 px-2 py-1 text-xs font-semibold text-white">
                    Featured
                  </div>
                )}

                {/* Discount Badge */}
                {hasDiscount && (
                  <div className="absolute top-2 right-2 rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                    {discountPercentage}% OFF
                  </div>
                )}

                {/* Edit Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="secondary" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Product
                  </Button>
                </div>
              </div>

              <CardContent className="p-4">
                {/* Product Name */}
                <h3 className="mb-1 line-clamp-2 font-semibold">{product.name}</h3>

                {/* Category */}
                {product.category && <p className="text-muted-foreground mb-2 text-xs">{product.category.name}</p>}

                {/* Price */}
                <div className="mb-2 flex items-baseline gap-2">
                  <span className="text-lg font-bold">{formatPrice(product.price)}</span>
                  {hasDiscount && (
                    <span className="text-muted-foreground text-sm line-through">
                      {formatPrice(product.compareAtPrice!)}
                    </span>
                  )}
                </div>

                {/* Stock Status */}
                <div
                  className={`mb-2 inline-block rounded-full px-2 py-1 text-xs font-medium ${stockStatus.className}`}
                >
                  {stockStatus.label}
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  {!product.isActive && (
                    <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700">
                      Inactive
                    </span>
                  )}
                  {product._count.reviews > 0 && (
                    <span className="text-muted-foreground text-xs">
                      {product._count.reviews} {product._count.reviews === 1 ? "review" : "reviews"}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Modal */}
      {selectedProduct && (
        <EditProductModal product={selectedProduct} open={editModalOpen} onOpenChange={setEditModalOpen} />
      )}
    </>
  );
};

export default ProductsList;
