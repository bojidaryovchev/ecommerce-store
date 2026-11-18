import { GUIDES, guideHref, guideText } from "@/content/guides";
import { Link } from "@/i18n/navigation";
import { Clock } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import React from "react";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guides.meta" });
  return { title: t("title"), description: t("description"), alternates: { canonical: guideHref() } };
}

const GuidesPage: React.FC<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("guides");

  return (
    <main className="max-w-container py-12 md:py-16">
      <div className="max-w-2xl">
        <p className="text-heat text-xs font-semibold tracking-[0.2em] uppercase">{t("eyebrow")}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance md:text-5xl">{t("title")}</h1>
        <p className="text-muted-foreground mt-4 text-lg leading-relaxed">{t("lead")}</p>
      </div>
      <ul className="mt-12 grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        {GUIDES.map((guide, index) => {
          const text = guideText(guide, locale);
          return (
            <li key={guide.slug}>
              <Link href={guideHref(guide.slug)} className="group block">
                <span className="bg-muted relative block aspect-[16/10] overflow-hidden rounded-2xl">
                  <Image
                    src={guide.image}
                    alt=""
                    fill
                    priority={index < 3}
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </span>
                <span className="text-muted-foreground mt-4 flex items-center gap-1.5 text-xs">
                  <Clock className="size-3.5" aria-hidden />
                  {t("minutes", { count: guide.readingMinutes })}
                </span>
                <span className="group-hover:text-primary mt-1.5 block text-xl leading-snug font-semibold transition-colors">
                  {text.title}
                </span>
                <span className="text-muted-foreground mt-2 block leading-relaxed">{text.excerpt}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
};

export default GuidesPage;
