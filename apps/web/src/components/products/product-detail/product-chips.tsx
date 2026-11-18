import type { ProductMedia } from "@ecommerce/database/schema";
import { useTranslations } from "next-intl";
import Image from "next/image";
import React from "react";

/**
 * The supplier's feature icons, certification badges and energy-class graphics as small labelled chips
 * under the gallery: a gallery is for photos of the product, and an icon blown up to photo size says less
 * than its label.
 */
const ProductChips: React.FC<{ chips: ProductMedia["chips"] }> = ({ chips }) => {
  const t = useTranslations("products.detail");
  const labelled = chips.filter((chip) => chip.label);
  if (labelled.length === 0) return null;

  return (
    // One scrollable row on phones, so the name and price stay near the photos; wrapped on wide screens.
    <ul
      className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
      aria-label={t("features")}
    >
      {labelled.map((chip) => (
        <li
          key={chip.url}
          className="bg-muted/60 text-foreground inline-flex shrink-0 items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-xs font-medium whitespace-nowrap"
        >
          <span className="relative size-6 shrink-0 overflow-hidden rounded-full bg-white">
            <Image src={chip.url} alt="" fill sizes="24px" className="object-contain p-0.5" />
          </span>
          {chip.label}
        </li>
      ))}
    </ul>
  );
};

export { ProductChips };
