import { ProductsGridSkeleton } from "@/components/common";
import {
  BlueprintBand,
  CategoryShowcase,
  ContactBand,
  GuidesTeaser,
  HomeFaq,
  HomeHero,
  HowItWorks,
  SeasonalProducts,
  ToolsTeaser,
  TrustStrip,
} from "@/components/home";
import { localizedAlternates } from "@/lib/seo";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import React, { Suspense } from "react";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: localizedAlternates("/", locale) };
}

const Home: React.FC<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main>
      <HomeHero />
      <TrustStrip />
      <Suspense
        fallback={
          <div className="max-w-container py-20">
            <ProductsGridSkeleton />
          </div>
        }
      >
        <CategoryShowcase />
      </Suspense>
      <BlueprintBand />
      <HowItWorks />
      <Suspense
        fallback={
          <div className="max-w-container py-20">
            <ProductsGridSkeleton />
          </div>
        }
      >
        <SeasonalProducts />
      </Suspense>
      <ToolsTeaser />
      <GuidesTeaser />
      <HomeFaq />
      <ContactBand />
    </main>
  );
};

export default Home;
