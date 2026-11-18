import { WishlistButton } from "@/components/products/wishlist-button";
import { priceFormat } from "@/i18n/format";
import { Link } from "@/i18n/navigation";
import { primaryPhoto } from "@/lib/product-media";
import { productHref } from "@/lib/routes";
import type { ProductWithPrices } from "@/types/product.type";
import { useFormatter, useTranslations } from "next-intl";
import Image from "next/image";
import React from "react";

interface Props {
  product: ProductWithPrices;
  priority?: boolean;
  isWishlisted?: boolean;
}

/**
 * A product in a listing: the photo whole on white (product shots are cut-outs; cropping them to a
 * square cut units in half), the brand, the name and the price with VAT. No description: the
 * supplier's text is not ours to repeat on every card.
 */
const ProductCard: React.FC<Props> = ({ product, priority = false, isWishlisted }) => {
  const t = useTranslations("products.productCard");
  const format = useFormatter();
  const defaultPrice = product.prices.find((p) => p.id === product.defaultPriceId) ?? product.prices[0];
  const image = primaryPhoto(product);
  const outOfStock = product.trackInventory && (product.stockQuantity ?? 0) <= 0;
  const badge = !product.active ? t("unavailable") : outOfStock ? t("outOfStock") : null;

  return (
    <Link
      href={productHref(product)}
      className="group bg-card hover:border-primary/20 flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/5"
    >
      <div className="relative aspect-square bg-white">
        {isWishlisted !== undefined && <WishlistButton productId={product.id} isWishlisted={isWishlisted} />}
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw"
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-105 md:p-6"
            priority={priority}
          />
        ) : (
          <div className="bg-muted text-muted-foreground flex size-full items-center justify-center text-4xl">
            {product.name.charAt(0).toUpperCase()}
          </div>
        )}
        {badge && (
          <span className="bg-background/90 absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm ring-1 ring-black/5">
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col border-t p-4">
        {product.brand && (
          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">{product.brand}</p>
        )}
        {/* Three lines in a narrow phone card, or the model that tells products apart is cut off. */}
        <h3 className="mt-1 line-clamp-3 text-sm leading-snug font-medium sm:line-clamp-2">{product.name}</h3>
        {product.keySpecs && product.keySpecs.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {product.keySpecs.map((spec) => (
              <li key={spec} className="bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 text-xs font-medium">
                {spec}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto pt-4">
          {defaultPrice && defaultPrice.unitAmount !== null ? (
            <p className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-lg font-bold tabular-nums">
                {format.number(defaultPrice.unitAmount / 100, priceFormat(defaultPrice.currency))}
              </span>
              <span className="text-muted-foreground text-xs whitespace-nowrap">{t("withVat")}</span>
            </p>
          ) : (
            <p className="text-muted-foreground text-sm font-medium">{t("priceOnRequest")}</p>
          )}
        </div>
      </div>
    </Link>
  );
};

export { ProductCard };
