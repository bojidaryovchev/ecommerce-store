import { WishlistButton } from "@/components/products/wishlist-button";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import type { ProductWithDetails } from "@/types/product.type";
import Image from "next/image";
import Link from "next/link";
import React, { Suspense } from "react";
import { ProductAddToCart } from "./product-add-to-cart";
import { ReviewSection } from "./review-section";

interface Props {
  product: ProductWithDetails;
  isWishlisted?: boolean;
}

const ProductDetail: React.FC<Props> = ({ product, isWishlisted }) => {
  const defaultPrice = product.prices.find((p) => p.id === product.defaultPriceId) ?? product.prices[0];
  const productImage = product.images?.[0];

  return (
    <div className="space-y-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/products">Products</BreadcrumbLink>
          </BreadcrumbItem>
          {product.category && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/categories/${product.category.slug}`}>{product.category.name}</BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg">
            {productImage ? (
              <Image
                src={productImage}
                alt={product.name}
                width={600}
                height={450}
                className="h-auto w-full rounded-lg"
                priority
              />
            ) : (
              <div className="bg-muted flex aspect-square items-center justify-center rounded-lg">
                <span className="text-muted-foreground text-8xl">{product.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <div
                  key={index}
                  className={`bg-muted h-20 w-20 shrink-0 overflow-hidden rounded-lg ${
                    index === 0 ? "ring-primary ring-2" : ""
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} image ${index + 1}`}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {product.category && (
                <Link href={`/categories/${product.category.slug}`}>
                  <Badge variant="secondary">{product.category.name}</Badge>
                </Link>
              )}
              {!product.active && <Badge variant="destructive">Unavailable</Badge>}
            </div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            {defaultPrice && defaultPrice.unitAmount !== null && (
              <p className="text-primary text-3xl font-bold">
                {formatCurrency(defaultPrice.unitAmount, defaultPrice.currency)}
              </p>
            )}
            {product.trackInventory && (
              <div className="mt-1">
                {product.stockQuantity === null || product.stockQuantity <= 0 ? (
                  <Badge variant="destructive">Out of Stock</Badge>
                ) : product.stockQuantity <= 10 ? (
                  <Badge variant="outline" className="border-amber-500 text-amber-600">
                    Low Stock — Only {product.stockQuantity} left
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-green-500 text-green-600">
                    In Stock
                  </Badge>
                )}
              </div>
            )}
          </div>

          {product.description && (
            <div className="space-y-2">
              <h2 className="font-semibold">Description</h2>
              <p className="text-muted-foreground">{product.description}</p>
            </div>
          )}

          <Separator />

          <div className="space-y-4">
            <ProductAddToCart
              productId={product.id}
              priceId={defaultPrice?.id}
              isActive={product.active}
              trackInventory={product.trackInventory}
              stockQuantity={product.stockQuantity}
            />

            {isWishlisted !== undefined && (
              <WishlistButton productId={product.id} isWishlisted={isWishlisted} variant="labeled" />
            )}
          </div>

          {/* Product Details */}
          <Card>
            <CardContent className="space-y-4">
              <h3 className="font-semibold">Product Details</h3>
              <dl className="divide-border divide-y">
                {product.shippable !== null && (
                  <div className="flex justify-between py-2">
                    <dt className="text-muted-foreground">Shipping</dt>
                    <dd>{product.shippable ? "Physical product" : "Digital product"}</dd>
                  </div>
                )}
                {product.unitLabel && (
                  <div className="flex justify-between py-2">
                    <dt className="text-muted-foreground">Unit</dt>
                    <dd>{product.unitLabel}</dd>
                  </div>
                )}
                {product.prices.length > 1 && (
                  <div className="flex justify-between py-2">
                    <dt className="text-muted-foreground">Price Options</dt>
                    <dd>{product.prices.length} available</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Marketing Features */}
          {product.marketingFeatures && product.marketingFeatures.length > 0 && (
            <Card>
              <CardContent className="space-y-4">
                <h3 className="font-semibold">Features</h3>
                <ul className="space-y-2">
                  {product.marketingFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      <span>{feature.name}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <Suspense
        fallback={
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Customer Reviews</h2>
            <p className="text-muted-foreground text-sm">Loading reviews...</p>
          </div>
        }
      >
        <ReviewSection productId={product.id} />
      </Suspense>
    </div>
  );
};

export { ProductDetail };
