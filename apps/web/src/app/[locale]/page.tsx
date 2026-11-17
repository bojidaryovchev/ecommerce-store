import { CategoriesGridSkeleton, ProductsGridSkeleton, SectionHeader } from "@/components/common";
import { FeaturedCategories, FeaturedProducts, HomeHero } from "@/components/home";
import { getTranslations, setRequestLocale } from "next-intl/server";
import React, { Suspense } from "react";

type Props = {
  params: Promise<{ locale: string }>;
};

const Home: React.FC<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <main className="max-w-container py-8">
      <HomeHero />

      <section className="space-y-8 py-12">
        <SectionHeader title={t("featuredProducts.title")} link="/products" />
        <Suspense fallback={<ProductsGridSkeleton />}>
          <FeaturedProducts />
        </Suspense>
      </section>

      <section className="space-y-8 py-12">
        <SectionHeader title={t("featuredCategories.title")} link="/categories" />
        <Suspense fallback={<CategoriesGridSkeleton />}>
          <FeaturedCategories />
        </Suspense>
      </section>
    </main>
  );
};

export default Home;
