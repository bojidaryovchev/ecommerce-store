import { ProductsGrid } from "@/components/products";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { getWishlistByUserId, getWishlistProductIds } from "@/queries/wishlist";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import React from "react";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.wishlist.metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

const WishlistPage: React.FC<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();

  if (!session?.user?.id) {
    return redirect({ href: "/login", locale });
  }

  const t = await getTranslations("account.wishlist");

  const [products, wishlistedProductIds] = await Promise.all([
    getWishlistByUserId(session.user.id),
    getWishlistProductIds(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">{t("title")}</h2>
        <p className="text-muted-foreground text-sm">
          {products.length === 0 ? t("empty") : t("count", { count: products.length })}
        </p>
      </div>

      <ProductsGrid
        products={products}
        wishlistedProductIds={wishlistedProductIds}
        variant="compact"
        emptyMessage={t("empty")}
      />
    </div>
  );
};

export default WishlistPage;
