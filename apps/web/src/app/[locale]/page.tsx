import { ProductsGridSkeleton } from "@/components/common";
import {
  BlueprintBand,
  CategoryShowcase,
  ContactBand,
  GuidesTeaser,
  HomeFaq,
  HomeHero,
  HowItWorks,
  PromoStrip,
  SeasonalProducts,
  ToolsTeaser,
  TrustStrip,
} from "@/components/home";
import { JsonLd } from "@/components/seo";
import { CONTACT_EMAIL } from "@/constants";
import { localizedAlternates } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-url";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import React, { Suspense } from "react";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: { absolute: `${t("homeTitle")} | ${t("siteTitle")}` },
    alternates: localizedAlternates("/", locale),
    openGraph: { images: ["/images/site/hero.webp"] },
  };
}

const Home: React.FC<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("metadata");
  const home = `${SITE_URL}${locale === "en" ? "/en" : "/"}`;

  return (
    <main>
      {/* The site's name and the business behind it, for Search's site name and knowledge panel. */}
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            name: t("siteTitle"),
            url: home,
            inLanguage: locale,
            publisher: { "@id": `${SITE_URL}/#organization` },
          },
          {
            "@context": "https://schema.org",
            "@type": "OnlineStore",
            "@id": `${SITE_URL}/#organization`,
            name: t("siteTitle"),
            url: SITE_URL,
            logo: `${SITE_URL}/apple-icon.png`,
            email: CONTACT_EMAIL,
            areaServed: { "@type": "Country", name: "Bulgaria" },
            hasMerchantReturnPolicy: {
              "@type": "MerchantReturnPolicy",
              applicableCountry: "BG",
              returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
              merchantReturnDays: 14,
              returnMethod: "https://schema.org/ReturnByMail",
              returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
              refundType: "https://schema.org/FullRefund",
            },
          },
        ]}
      />
      <HomeHero />
      <PromoStrip />
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
