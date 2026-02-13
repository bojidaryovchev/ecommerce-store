import { CategoriesGridSkeleton, ProductsGridSkeleton, SectionHeader } from "@/components/common";
import { FeaturedCategories, FeaturedProducts, HomeHero } from "@/components/home";
import React, { Suspense } from "react";

const Home: React.FC = () => {
  return (
    <main className="container mx-auto px-4 py-8">
      <HomeHero />

      <section className="space-y-8 py-12">
        <SectionHeader title="Featured Products" link="/products" linkText="View All" />
        <Suspense fallback={<ProductsGridSkeleton />}>
          <FeaturedProducts />
        </Suspense>
      </section>

      <section className="space-y-8 py-12">
        <SectionHeader title="Shop by Category" link="/categories" linkText="View All" />
        <Suspense fallback={<CategoriesGridSkeleton />}>
          <FeaturedCategories />
        </Suspense>
      </section>
    </main>
  );
};

export default Home;
