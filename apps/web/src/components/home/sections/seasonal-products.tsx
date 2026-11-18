import { Reveal } from "@/components/motion";
import { ProductCard } from "@/components/products";
import { getSeasonalProducts } from "@/queries/products";
import { getTranslations } from "next-intl/server";
import React from "react";
import { SectionHeading } from "./section-heading";

/** Two picks from each of the season's categories: heating in the cold months, cooling in summer. */
const SeasonalProducts: React.FC = async () => {
  const [{ season, products, categorySlug }, t] = await Promise.all([
    getSeasonalProducts(),
    getTranslations("home.seasonal"),
  ]);
  if (products.length === 0) return null;

  return (
    <Reveal as="section" className="max-w-container py-16 md:py-20" stagger={0.05}>
      <SectionHeading
        eyebrow={t(`${season}.eyebrow`)}
        title={t(`${season}.title`)}
        link={{ href: `/${categorySlug}`, label: t("viewAll") }}
      />
      <ul className="mt-10 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {products.map((product) => (
          <li key={product.id} data-reveal>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </Reveal>
  );
};

export { SeasonalProducts };
