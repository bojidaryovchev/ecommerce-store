import { getSimilarProducts } from "@/queries/products";
import { getTranslations } from "next-intl/server";
import React from "react";
import { ProductsGrid } from "../products-grid";

interface Props {
  productId: string;
  categoryId: string | null;
  priceAmount: number | null;
}

/** Other products from the same category, closest in price first. */
const SimilarProducts: React.FC<Props> = async (props) => {
  const [products, t] = await Promise.all([
    getSimilarProducts({ id: props.productId, categoryId: props.categoryId, priceAmount: props.priceAmount }),
    getTranslations("products.detail"),
  ]);

  if (products.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{t("similar")}</h2>
      <ProductsGrid products={products} />
    </section>
  );
};

export { SimilarProducts };
