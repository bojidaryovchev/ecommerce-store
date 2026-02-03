import CategoriesGrid from "@/components/categories-grid.component";
import HomeHero from "@/components/home-hero.component";
import ProductsGrid from "@/components/products-grid.component";
import SectionHeader from "@/components/section-header.component";
import { getRootCategories } from "@/lib/queries/categories";
import { getFeaturedProducts } from "@/lib/queries/products";
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

const FeaturedProducts: React.FC = async () => {
  const products = await getFeaturedProducts(8);
  return <ProductsGrid products={products} />;
};

const FeaturedCategories: React.FC = async () => {
  const categories = await getRootCategories();
  const featuredCategories = categories.slice(0, 4);

  return <CategoriesGrid categories={featuredCategories} />;
};

const ProductsGridSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="bg-muted aspect-square animate-pulse rounded-lg" />
          <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
          <div className="bg-muted h-4 w-1/2 animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
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
