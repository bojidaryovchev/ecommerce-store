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
import { Separator } from "@/components/ui/separator";
import { priceFormat } from "@/i18n/format";
import { Link } from "@/i18n/navigation";
import type { CategoryNode } from "@/lib/category-tree";
import { categoryHref } from "@/lib/routes";
import type { getProductBySlug } from "@/queries/products";
import { useFormatter, useTranslations } from "next-intl";
import React, { Suspense } from "react";
import { ProductAddToCart } from "./product-add-to-cart";
import { ProductGallery } from "./product-gallery";
import { ProductSpecs } from "./product-specs";
import { ReviewSection } from "./review-section";
import { SimilarProducts } from "./similar-products";

type Product = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

interface Props {
  product: Product;
  /** The product's category and its ancestors, root first. */
  categoryTrail: CategoryNode[];
  isWishlisted?: boolean;
}

const ProductDetail: React.FC<Props> = ({ product, categoryTrail, isWishlisted }) => {
  const t = useTranslations("products.detail");
  const tReviews = useTranslations("products.reviews");
  const format = useFormatter();
  const defaultPrice = product.prices.find((p) => p.id === product.defaultPriceId) ?? product.prices[0];
  const hasPrice = defaultPrice !== undefined && defaultPrice.unitAmount !== null;
  const outOfStock = product.trackInventory && (product.stockQuantity === null || product.stockQuantity <= 0);

  return (
    <div className="space-y-10">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">{t("breadcrumb.home")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {categoryTrail.map((category, index) => (
            <React.Fragment key={category.id}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={categoryHref(categoryTrail.slice(0, index + 1))}>{category.name}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </React.Fragment>
          ))}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="line-clamp-1">{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} name={product.name} />

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {product.brand && (
                <Link href={`/products?brand=${encodeURIComponent(product.brand)}`}>
                  <Badge variant="secondary">{product.brand}</Badge>
                </Link>
              )}
              {!product.active && <Badge variant="destructive">{t("unavailable")}</Badge>}
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">{product.name}</h1>
          </div>

          <div className="space-y-1">
            {hasPrice ? (
              <>
                <p className="text-primary text-3xl font-bold">
                  {format.number(defaultPrice.unitAmount! / 100, priceFormat(defaultPrice.currency))}
                </p>
                <p className="text-muted-foreground text-sm">{t("vatIncluded")}</p>
              </>
            ) : (
              <p className="text-xl font-semibold">{t("priceOnRequest")}</p>
            )}
            <div className="pt-2">
              {outOfStock ? (
                <Badge variant="destructive">{t("outOfStock")}</Badge>
              ) : (
                <Badge variant="outline" className="border-green-500 text-green-600">
                  {t("inStock")}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <ProductAddToCart
              productId={product.id}
              priceId={hasPrice ? defaultPrice.id : undefined}
              isActive={product.active}
              trackInventory={product.trackInventory}
              stockQuantity={product.stockQuantity}
            />
            {isWishlisted !== undefined && (
              <WishlistButton productId={product.id} isWishlisted={isWishlisted} variant="labeled" />
            )}
          </div>

          {product.marketingFeatures && product.marketingFeatures.length > 0 && (
            <ul className="space-y-2">
              {product.marketingFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <span className="text-primary">✓</span>
                  <span>{feature.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Separator />

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        {product.description && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">{t("description")}</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
          </section>
        )}
        <ProductSpecs brand={product.brand} values={product.attributeValues} />
      </div>

      <Suspense fallback={null}>
        <SimilarProducts
          productId={product.id}
          categoryId={product.categoryId}
          priceAmount={hasPrice ? defaultPrice.unitAmount : null}
        />
      </Suspense>

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
