import { WishlistButton } from "@/components/products/wishlist-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { ProductWithPrices } from "@/types/product.type";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface Props {
  product: ProductWithPrices;
  priority?: boolean;
  isWishlisted?: boolean;
}

const ProductCard: React.FC<Props> = ({ product, priority = false, isWishlisted }) => {
  const defaultPrice = product.prices.find((p) => p.id === product.defaultPriceId) ?? product.prices[0];
  const productImage = product.images?.[0];

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="h-full cursor-pointer transition-transform hover:scale-105">
        <CardContent className="relative overflow-hidden p-0">
          {isWishlisted !== undefined && <WishlistButton productId={product.id} isWishlisted={isWishlisted} />}
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

export { ProductCard };
