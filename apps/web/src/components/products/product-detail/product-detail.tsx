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
import { priceFormat } from "@/i18n/format";
import { Link } from "@/i18n/navigation";
import type { ProductWithDetails } from "@/types/product.type";
import { useFormatter, useTranslations } from "next-intl";
import Image from "next/image";
import React, { Suspense } from "react";
import { ProductAddToCart } from "./product-add-to-cart";
import { ReviewSection } from "./review-section";

interface Props {
  product: ProductWithDetails;
  isWishlisted?: boolean;
}

const ProductDetail: React.FC<Props> = ({ product, isWishlisted }) => {
  const t = useTranslations("products.detail");
  const tReviews = useTranslations("products.reviews");
  const format = useFormatter();
  const defaultPrice = product.prices.find((p) => p.id === product.defaultPriceId) ?? product.prices[0];
  const productImage = product.images?.[0];

  return (
    <div className="space-y-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">{t("breadcrumb.home")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/products">{t("breadcrumb.products")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {product.category && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/categories/${product.category.slug}`}>{product.category.name}</Link>
                </BreadcrumbLink>
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
                    alt={t("imageAlt", { name: product.name, number: index + 1 })}
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
              {!product.active && <Badge variant="destructive">{t("unavailable")}</Badge>}
            </div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            {defaultPrice && defaultPrice.unitAmount !== null && (
              <p className="text-primary text-3xl font-bold">
                {format.number(defaultPrice.unitAmount / 100, priceFormat(defaultPrice.currency))}
              </p>
            )}
            {product.trackInventory && (
              <div className="mt-1">
                {product.stockQuantity === null || product.stockQuantity <= 0 ? (
                  <Badge variant="destructive">{t("outOfStock")}</Badge>
                ) : product.stockQuantity <= 10 ? (
                  <Badge variant="outline" className="border-amber-500 text-amber-600">
                    {t("lowStock", { count: product.stockQuantity })}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-green-500 text-green-600">
                    {t("inStock")}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {product.description && (
            <div className="space-y-2">
              <h2 className="font-semibold">{t("description")}</h2>
              <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
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
              <h3 className="font-semibold">{t("details")}</h3>
              <dl className="divide-border divide-y">
                {product.shippable !== null && (
                  <div className="flex justify-between py-2">
                    <dt className="text-muted-foreground">{t("shipping")}</dt>
                    <dd>{product.shippable ? t("physicalProduct") : t("digitalProduct")}</dd>
                  </div>
                )}
                {product.unitLabel && (
                  <div className="flex justify-between py-2">
                    <dt className="text-muted-foreground">{t("unit")}</dt>
                    <dd>{product.unitLabel}</dd>
                  </div>
                )}
                {product.prices.length > 1 && (
                  <div className="flex justify-between py-2">
                    <dt className="text-muted-foreground">{t("priceOptions")}</dt>
                    <dd>{t("priceOptionsAvailable", { count: product.prices.length })}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Marketing Features */}
          {product.marketingFeatures && product.marketingFeatures.length > 0 && (
            <Card>
              <CardContent className="space-y-4">
                <h3 className="font-semibold">{t("features")}</h3>
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
            <h2 className="text-xl font-semibold">{tReviews("title")}</h2>
            <p className="text-muted-foreground text-sm">{tReviews("loading")}</p>
          </div>
        }
      >
        <ReviewSection productId={product.id} />
      </Suspense>
    </div>
  );
};

export { ProductDetail };
