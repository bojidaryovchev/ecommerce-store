import { Link } from "@/i18n/navigation";
import { TOOLS } from "@/lib/calculators";
import { localizedAlternates } from "@/lib/seo";
import { AirVent, ArrowRight, Heater, ThermometerSun } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import React from "react";

type Props = { params: Promise<{ locale: string }> };

const ICONS = { termopompa: ThermometerSun, klimatik: AirVent, radiatori: Heater } as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tools.meta" });
  return { title: t("title"), description: t("description"), alternates: localizedAlternates("/kalkulatori", locale) };
}

const ToolsPage: React.FC<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("tools");
  return (
    <main className="max-w-container py-12 md:py-16">
      <div className="max-w-2xl">
        <p className="text-heat text-xs font-semibold tracking-[0.2em] uppercase">{t("eyebrow")}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance md:text-5xl">{t("title")}</h1>
        <p className="text-muted-foreground mt-4 text-lg leading-relaxed">{t("lead")}</p>
      </div>
      <ul className="mt-12 grid gap-5 md:grid-cols-3">
        {TOOLS.map((tool) => {
          const Icon = ICONS[tool];
          return (
            <li key={tool}>
              <Link
                href={`/kalkulatori/${tool}`}
                className="group bg-card hover:border-primary/20 flex h-full flex-col rounded-3xl border p-7 transition-all hover:shadow-xl hover:shadow-black/5"
              >
                <span className="bg-primary/5 text-primary grid size-14 place-items-center rounded-2xl">
                  <Icon className="size-7" aria-hidden />
                </span>
                <span className="mt-6 text-xl font-semibold">{t(`${tool}.title`)}</span>
                <span className="text-muted-foreground mt-2">{t(`${tool}.short`)}</span>
                <span className="text-primary mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold">
                  {t("open")}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
};

export default ToolsPage;
