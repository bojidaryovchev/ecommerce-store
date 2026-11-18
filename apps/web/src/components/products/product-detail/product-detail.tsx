import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { priceFormat } from "@/i18n/format";
import { Link } from "@/i18n/navigation";
import type { CategoryNode } from "@/lib/category-tree";
import { INSTALLATION_FOR_CATEGORY, installationHref } from "@/lib/installation-systems";
import { productPhotos } from "@/lib/product-media";
import { categoryHref } from "@/lib/routes";
import type { getProductBySlug } from "@/queries/products";
import { ArrowRight, CreditCard, MessageCircleQuestion, ShieldCheck, Truck, Undo2, Wrench } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import React, { Suspense } from "react";
import { ExpandableText } from "./expandable-text";
import { ProductAddToCart } from "./product-add-to-cart";
import { ProductChips } from "./product-chips";
import { ProductDrawings } from "./product-drawings";
import { ProductGallery } from "./product-gallery";
import { ProductSpecs, specRows } from "./product-specs";
import { ProductWishlist } from "./product-wishlist";
import { ReviewSection } from "./review-section";
import { SimilarProducts } from "./similar-products";
import { SpecComparison } from "./spec-comparison";
import { StickyBuyBar } from "./sticky-buy-bar";

type Product = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

interface Props {
  product: Product;
  /** The product's category and its ancestors, root first. */
  categoryTrail: CategoryNode[];
}

/** How many specifications the buy box shows; the rest are in the table below. */
const KEY_SPECS = 4;
const BUY_BUTTON_ID = "buy-box";

const ProductDetail: React.FC<Props> = ({ product, categoryTrail }) => {
  const t = useTranslations("products.detail");
  const tReviews = useTranslations("products.reviews");
  const tSystems = useTranslations("installation.systems");
  const format = useFormatter();
  const defaultPrice = product.prices.find((p) => p.id === product.defaultPriceId) ?? product.prices[0];
  const hasPrice = defaultPrice !== undefined && defaultPrice.unitAmount !== null;
  const price = hasPrice ? format.number(defaultPrice.unitAmount! / 100, priceFormat(defaultPrice.currency)) : null;
  const outOfStock = product.trackInventory && (product.stockQuantity === null || product.stockQuantity <= 0);
  const canBuy = hasPrice && product.active && !outOfStock;
  const specs = specRows(product.attributeValues);
  const system = INSTALLATION_FOR_CATEGORY[categoryTrail[0]?.slug ?? ""];
  const services = [
    { icon: Truck, title: t("service.delivery"), text: t("service.deliveryText"), href: "/dostavka" },
    { icon: Undo2, title: t("service.withdrawal"), text: t("service.withdrawalText"), href: "/vrashtane" },
    { icon: ShieldCheck, title: t("service.warranty"), text: t("service.warrantyText"), href: "/garantsiya" },
    { icon: CreditCard, title: t("service.payment"), text: t("service.paymentText"), href: "/obshti-usloviya" },
  ];

  return (
    <div className="space-y-14">
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

      <div className="-mt-6 grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
        <div className="space-y-4">
          <ProductGallery images={productPhotos(product)} name={product.name} />
          {product.media && <ProductChips chips={product.media.chips} />}
        </div>

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
            <h1 className="text-2xl leading-tight font-bold tracking-tight text-balance sm:text-3xl">{product.name}</h1>
          </div>

          {specs.length > 0 && (
            <div>
              <dl className="grid grid-cols-2 gap-2">
                {specs.slice(0, KEY_SPECS).map((row) => (
                  <div key={row.name} className="bg-muted/60 rounded-xl px-3.5 py-2.5">
                    <dt className="text-muted-foreground line-clamp-1 text-xs">{row.name}</dt>
                    <dd className="mt-0.5 line-clamp-2 text-sm font-semibold">{row.values.join(", ")}</dd>
                  </div>
                ))}
              </dl>
              {specs.length > KEY_SPECS && (
                <a
                  href="#harakteristiki"
                  className="text-primary mt-2 inline-flex items-center gap-1 text-sm font-medium hover:underline"
                >
                  {t("allSpecs")}
                  <ArrowRight className="size-3.5" aria-hidden />
                </a>
              )}
            </div>
          )}

          <div className="bg-card space-y-4 rounded-2xl border p-5 shadow-sm">
            <div>
              {price ? (
                <>
                  <p className="text-primary text-3xl font-bold tracking-tight">{price}</p>
                  <p className="text-muted-foreground text-sm">{t("vatIncluded")}</p>
                </>
              ) : (
                <p className="text-xl font-semibold">{t("priceOnRequest")}</p>
              )}
              <p className="mt-3 flex items-center gap-2 text-sm font-medium">
                <span
                  className={outOfStock ? "bg-destructive size-2 rounded-full" : "size-2 rounded-full bg-emerald-500"}
                  aria-hidden
                />
                <span className={outOfStock ? "text-destructive" : "text-emerald-700 dark:text-emerald-400"}>
                  {outOfStock ? t("outOfStock") : t("inStock")}
                </span>
              </p>
            </div>
            <div id={BUY_BUTTON_ID}>
              <ProductAddToCart
                productId={product.id}
                priceId={hasPrice ? defaultPrice.id : undefined}
                isActive={product.active}
                trackInventory={product.trackInventory}
                stockQuantity={product.stockQuantity}
              />
            </div>
            <Suspense fallback={null}>
              <ProductWishlist productId={product.id} />
            </Suspense>
          </div>

          {system && (
            <div className="bg-heat-soft rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <Wrench className="text-heat mt-0.5 size-5 shrink-0" aria-hidden />
                <div>
                  <p className="font-semibold">{t("install.title")}</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {t("install.text", { system: tSystems(`${system}.title`) })}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
                    <Link href={`/kontakti?tema=ogled&sistema=${system}`} className="text-heat hover:underline">
                      {t("install.visit")}
                    </Link>
                    <Link href={installationHref(system)} className="text-primary hover:underline">
                      {t("install.how")}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          <ul className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
            {services.map(({ icon: Icon, title, text, href }) => (
              <li key={title}>
                <Link href={href} className="group flex gap-3">
                  <Icon className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
                  <span>
                    <span className="group-hover:text-primary block text-sm font-semibold transition-colors">
                      {title}
                    </span>
                    <span className="text-muted-foreground block text-xs">{text}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {product.slug && (
            <Link
              href={`/kontakti?tema=vapros&produkt=${product.slug}`}
              className="hover:bg-muted/60 flex items-center gap-3 rounded-2xl border border-dashed p-4 transition-colors"
            >
              <MessageCircleQuestion className="text-primary size-5 shrink-0" aria-hidden />
              <span className="flex-1 text-sm">
                <span className="font-semibold">{t("question.title")}</span>{" "}
                <span className="text-muted-foreground">{t("question.text")}</span>
              </span>
              <ArrowRight className="text-primary size-4 shrink-0" aria-hidden />
            </Link>
          )}

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

      <div className="grid grid-cols-1 items-start gap-10 border-t pt-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-14">
        <div className="space-y-10">
          {product.description && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">{t("description")}</h2>
              <ExpandableText text={product.description} />
            </section>
          )}
          {product.media && <ProductDrawings images={product.media.drawings} name={product.name} />}
        </div>
        <div className="space-y-10 lg:sticky lg:top-32">
          <ProductSpecs brand={product.brand} values={product.attributeValues} />
          {categoryTrail[0] && (
            <Suspense fallback={null}>
              <SpecComparison
                rootCategoryId={categoryTrail[0].id}
                rootCategoryName={categoryTrail[0].name}
                values={product.attributeValues}
              />
            </Suspense>
          )}
        </div>
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

      {canBuy && price && defaultPrice && (
        <StickyBuyBar
          targetId={BUY_BUTTON_ID}
          name={product.name}
          price={price}
          productId={product.id}
          priceId={defaultPrice.id}
        />
      )}
    </div>
  );
};

export { ProductDetail };
