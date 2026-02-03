import CategoriesGrid from "@/components/categories-grid.component";
import HomeHero from "@/components/home-hero.component";
import SectionHeader from "@/components/section-header.component";
import { getRootCategories } from "@/lib/queries/categories";
import React, { Suspense } from "react";

const Home: React.FC = () => {
  return (
    <main className="container mx-auto px-4 py-8">
      <HomeHero />

      <section className="space-y-8 py-12">
        <SectionHeader title="Shop by Category" />
        <Suspense fallback={<CategoriesGridSkeleton />}>
          <FeaturedCategories />
        </Suspense>
      </section>
    </main>
  );
};

const FeaturedCategories: React.FC = async () => {
  const categories = await getRootCategories();
  const featuredCategories = categories.slice(0, 4);

  return <CategoriesGrid categories={featuredCategories} />;
};

const CategoriesGridSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-muted aspect-square animate-pulse rounded-lg" />
      ))}
    </div>
  );
};

export default Home;
