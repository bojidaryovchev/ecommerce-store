import { ToolCalculator } from "@/components/tools";
import { Link } from "@/i18n/navigation";
import { isTool, TOOLS } from "@/lib/calculators";
import { localizedAlternates } from "@/lib/seo";
import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import React from "react";

type Props = { params: Promise<{ locale: string; tool: string }> };

export function generateStaticParams() {
  return TOOLS.map((tool) => ({ tool }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, tool } = await params;
  if (!isTool(tool)) return {};
  const t = await getTranslations({ locale, namespace: "tools" });
  return {
    title: t(`${tool}.title`),
    description: t(`${tool}.short`),
    alternates: localizedAlternates(`/kalkulatori/${tool}`, locale),
  };
}

const ToolPage: React.FC<Props> = async ({ params }) => {
  const { locale, tool } = await params;
  if (!isTool(tool)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("tools");
  return (
    <main className="max-w-container py-10 md:py-14">
      <nav aria-label="breadcrumb" className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <Link href="/" className="hover:text-foreground">
          {t("home")}
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <Link href="/kalkulatori" className="hover:text-foreground">
          {t("eyebrow")}
        </Link>
      </nav>
      <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">{t(`${tool}.title`)}</h1>
      <p className="text-muted-foreground mt-3 max-w-2xl text-lg">{t("lead")}</p>
      <div className="mt-10">
        <ToolCalculator tool={tool} />
      </div>
    </main>
  );
};

export default ToolPage;
