import { SiteFooter } from "@/components/common";
import { CompareTray } from "@/components/products/compare/compare-tray";
import Providers from "@/components/providers";
import { routing } from "@/i18n/routing";
import { SITE_INDEXABLE } from "@/lib/indexing";
import { SITE_URL } from "@/lib/site-url";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import React from "react";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("siteTitle"), template: `%s | ${t("siteTitle")}` },
    description: t("siteDescription"),
    openGraph: { siteName: t("siteTitle"), locale: locale === "bg" ? "bg_BG" : "en_GB", type: "website" },
    // Until launch nothing is indexed (see lib/indexing.ts). Pages that set their own robots only ever
    // set noindex, so this cannot be overridden into an index.
    // Once indexing is on, large image previews are allowed (Discover, image results).
    robots: SITE_INDEXABLE ? { "max-image-preview": "large" } : { index: false, follow: false },
  };
}

const LocaleLayout: React.FC<Props> = async ({ children, params }) => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  // Lets next-intl read the locale without request headers, so pages can be prerendered.
  setRequestLocale(locale);

  return (
    <Providers locale={locale}>
      {children}
      <SiteFooter />
      <CompareTray />
    </Providers>
  );
};

export default LocaleLayout;
