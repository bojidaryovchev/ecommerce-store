import { ProductDetail } from "@/components/products";
import { categoryTrail } from "@/lib/category-tree";
import { categoryHref, productHref } from "@/lib/routes";
import { SITE_URL } from "@/lib/site-url";
import { getCategoryIndex } from "@/queries/categories";
import { getProductBySlug } from "@/queries/products";
import { getReviewsByProductId } from "@/queries/reviews";
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

  const reviews = await getReviewsByProductId(product.id);
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
        availability={!product.active ? "Discontinued" : outOfStock ? "OutOfStock" : "InStock"}
        category={trail.map((category) => category.name).join(" > ") || null}
        color={
          product.attributeValues
            .filter((value) => value.attribute.name.trim().toLowerCase() === "цвят")
            .map((value) => value.value)
            .join(", ") || null
        }
        rating={
          reviews.length > 0
            ? { value: reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length, count: reviews.length }
            : null
        }
        reviews={reviews.slice(0, 5).map((review) => ({
          author: review.user?.name?.split(" ")[0] || t("reviewer"),
          rating: review.rating,
          date: review.createdAt.toISOString().slice(0, 10),
          body: review.content,
        }))}
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
