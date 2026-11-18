import { InfoPage, infoMetadata } from "@/components/info";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import React from "react";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return infoMetadata("biskvitki", locale);
}

const Page: React.FC<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);
  return <InfoPage slug="biskvitki" locale={locale} />;
};

export default Page;
