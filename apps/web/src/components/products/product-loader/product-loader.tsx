import { ProductDetail } from "@/components/products";
import { categoryTrail } from "@/lib/category-tree";
import { categoryHref, productHref } from "@/lib/routes";
import { SITE_URL } from "@/lib/site-url";
import { getCategoryIndex } from "@/queries/categories";
import { getProductBySlug } from "@/queries/products";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import React from "react";
import { ProductJsonLd } from "../product-detail/product-json-ld";

interface Props {
  slug: string;
}

const ProductLoader: React.FC<Props> = async ({ slug }) => {
  // Nothing here reads the request (the wishlist heart does, in its own island), so the whole page
  // is prerendered: the product's content is in the HTML as served.
  const [product, categories, locale, t] = await Promise.all([
    getProductBySlug(slug),
    getCategoryIndex(),
    getLocale(),
    getTranslations("products.detail.breadcrumb"),
  ]);

  if (!product) {
    notFound();
  }

  const trail = categoryTrail(categories, product.categoryId);
  const prefix = locale === "en" ? "/en" : "";
  const url = `${SITE_URL}${prefix}${productHref(product)}`;
  const price = product.prices.find((p) => p.id === product.defaultPriceId) ?? product.prices[0];
  const outOfStock = product.trackInventory && (product.stockQuantity ?? 0) <= 0;

  return (
    <>
      <ProductJsonLd
        name={product.name}
        description={product.description}
        images={product.images}
        brand={product.brand}
        sku={product.slug ?? product.id}
        url={url}
        price={price?.unitAmount ? { amount: price.unitAmount, currency: price.currency } : null}
        availability={outOfStock ? "OutOfStock" : "InStock"}
        breadcrumbs={[
          { name: t("home"), url: `${SITE_URL}${prefix || "/"}` },
          ...trail.map((category, index) => ({
            name: category.name,
            url: `${SITE_URL}${prefix}${categoryHref(trail.slice(0, index + 1))}`,
          })),
          { name: product.name, url },
        ]}
      />
      <ProductDetail product={product} categoryTrail={trail} />
    </>
  );
};

export { ProductLoader };
