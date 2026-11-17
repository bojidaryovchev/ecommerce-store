import Providers from "@/components/providers";
import { routing } from "@/i18n/routing";
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
    title: { default: t("siteTitle"), template: `%s | ${t("siteTitle")}` },
    description: t("siteDescription"),
  };
}

const LocaleLayout: React.FC<Props> = async ({ children, params }) => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  // Lets next-intl read the locale without request headers, so pages can be prerendered.
  setRequestLocale(locale);

  return <Providers locale={locale}>{children}</Providers>;
};

export default LocaleLayout;
