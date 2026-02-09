import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { ProductWithPrices } from "@/types/category.type";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface Props {
  products: ProductWithPrices[];
}

const ProductsGrid: React.FC<Props> = ({ products }) => {
  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No products found in this category</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} priority={index < 4} />
      ))}
    </div>
  );
};

interface ProductCardProps {
  product: ProductWithPrices;
  priority?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, priority = false }) => {
  const defaultPrice = product.prices.find((p) => p.id === product.defaultPriceId) ?? product.prices[0];
  const productImage = product.images?.[0];

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="h-full cursor-pointer transition-transform hover:scale-105">
        <CardContent className="relative overflow-hidden p-0">
          {productImage ? (
            <Image
              src={productImage}
              alt={product.name}
              width={400}
              height={400}
              className="aspect-square w-full object-cover"
              priority={priority}
            />
          ) : (
            <div className="bg-muted flex aspect-square w-full items-center justify-center">
              <span className="text-muted-foreground text-4xl">{product.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          {!product.active && (
            <Badge variant="destructive" className="absolute top-2 right-2">
              Unavailable
            </Badge>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-2">
          <h3 className="line-clamp-1 font-semibold">{product.name}</h3>
          {product.description && <p className="text-muted-foreground line-clamp-2 text-sm">{product.description}</p>}
          {defaultPrice && defaultPrice.unitAmount !== null && (
            <p className="text-primary text-lg font-bold">
              {formatCurrency(defaultPrice.unitAmount, defaultPrice.currency)}
            </p>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
};

export default ProductsGrid;
