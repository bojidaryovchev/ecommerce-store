import { Product } from "@/actions/get-products.action";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Leaf, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercentage = hasDiscount
    ? Math.round((((product.compareAtPrice ?? 0) - product.price) / (product.compareAtPrice ?? 0)) * 100)
    : 0;
  const isLowStock = product.stockQuantity <= (product.lowStockThreshold ?? 0);

  return (
    <Link href={`/products/${product.slug}`} className="group">
      <Card className="border-border/50 overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg">
        <div className="bg-muted relative aspect-square overflow-hidden">
          <Image
            src={product.images[0]?.url || "/placeholder.svg"}
            alt={product.images[0]?.alt || product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.isFeatured && (
              <Badge className="bg-primary text-primary-foreground shadow-md">
                <Leaf className="mr-1 h-3 w-3" />
                Featured
              </Badge>
            )}
            {hasDiscount && (
              <Badge variant="destructive" className="shadow-md">
                {discountPercentage}% OFF
              </Badge>
            )}
          </div>
          {isLowStock && (
            <div className="absolute right-3 bottom-3">
              <Badge variant="secondary" className="bg-accent text-accent-foreground shadow-md">
                <Package className="mr-1 h-3 w-3" />
                Low Stock
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div className="mb-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {product.category?.name ?? ""}
            </p>
          </div>
          <h3 className="group-hover:text-primary mb-2 line-clamp-2 text-lg font-semibold text-balance transition-colors">
            {product.name}
          </h3>
          <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">{product.description}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-foreground text-2xl font-bold">${product.price.toFixed(2)}</span>
            {hasDiscount && (
              <span className="text-muted-foreground text-sm line-through">${product.compareAtPrice?.toFixed(2)}</span>
            )}
          </div>
        </CardContent>
        <CardFooter className="text-muted-foreground flex items-center justify-between p-4 pt-0 text-xs">
          <span className="flex items-center gap-1">
            <Package className="h-3.5 w-3.5" />
            {product.stockQuantity} in stock
          </span>
          <span className="font-mono text-xs">SKU: {product.sku}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
