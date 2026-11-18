import { ContactBand, HowItWorks } from "@/components/home";
import { Link } from "@/i18n/navigation";
import { INSTALLATION_SYSTEMS, installationHref } from "@/lib/installation-systems";
import { ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import React from "react";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "installation.hub" });
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: { canonical: installationHref() } };
}

const InstallationHub: React.FC<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, ti, tp] = await Promise.all([
    getTranslations("installation.hub"),
    getTranslations("installation.systems"),
    getTranslations("installation.page"),
  ]);
  const common = t.raw("common") as string[];

  return (
    <main>
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <Image
          src="/images/site/installation.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[30%_center] opacity-80"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/20"
        />
        <div className="max-w-container py-20 md:py-28">
          <div className="max-w-2xl">
            <p className="text-heat-soft text-xs font-semibold tracking-[0.25em] uppercase">{t("eyebrow")}</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-balance md:text-6xl">{t("title")}</h1>
            <p className="mt-6 text-lg leading-relaxed text-white/80">{t("lead")}</p>
            <Link
              href="/kontakti?tema=ogled"
              className="bg-heat text-heat-foreground hover:bg-heat/90 mt-9 inline-flex h-12 items-center rounded-full px-7 text-sm font-semibold transition-colors"
            >
              {tp("primary")}
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-container py-16 md:py-20">
        <h2 className="text-3xl font-bold tracking-tight">{t("systemsTitle")}</h2>
        <ul className="mt-8 grid gap-5 md:grid-cols-2">
          {INSTALLATION_SYSTEMS.map((system) => (
            <li key={system.slug}>
              <Link
                href={installationHref(system.slug)}
                className="group bg-card flex h-full flex-col overflow-hidden rounded-3xl border transition-shadow hover:shadow-xl hover:shadow-black/5 sm:flex-row"
              >
                <span className="bg-muted relative aspect-[4/3] shrink-0 overflow-hidden sm:aspect-auto sm:w-2/5">
                  <Image
                    src={system.image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 20vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </span>
                <span className="flex flex-col justify-center p-6">
                  <span className="text-xl font-semibold">{ti(`${system.slug}.title`)}</span>
                  <span className="text-muted-foreground mt-2 leading-relaxed">{ti(`${system.slug}.short`)}</span>
                  <span className="text-primary mt-5 inline-flex items-center gap-1.5 text-sm font-semibold">
                    {tp("eyebrow")}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="bg-muted/40 border-y">
        <HowItWorks />
      </div>

      <section className="max-w-container py-16 md:py-20">
        <p className="text-heat text-xs font-semibold tracking-[0.2em] uppercase">{t("commonEyebrow")}</p>
        <h2 className="mt-2.5 text-3xl font-bold tracking-tight">{t("commonTitle")}</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {common.map((item) => (
            <li key={item} className="bg-card flex items-center gap-3 rounded-2xl border p-5">
              <span className="bg-heat/10 text-heat grid size-8 shrink-0 place-items-center rounded-full">
                <Check className="size-4" aria-hidden />
              </span>
              <span className="font-medium">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <ContactBand />
    </main>
  );
};

export default InstallationHub;
