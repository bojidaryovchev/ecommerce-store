import { Link } from "@/i18n/navigation";
import { INSTALLATION_SYSTEMS, installationHref } from "@/lib/installation-systems";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import React from "react";

/** Systems the hero offers as entry points: the three that get an illustrated installation story. */
const HERO_SYSTEMS = INSTALLATION_SYSTEMS.filter((system) => system.slug !== "podovo-otoplenie");

/**
 * Full-bleed photo, the promise, the two actions, and the three installation entry points floating
 * over its lower edge. The photo is the page's largest paint, so it loads first.
 */
const HomeHero: React.FC = () => {
  const t = useTranslations("home.hero");
  const ti = useTranslations("installation.systems");

  return (
    <>
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <Image
          src="/images/site/hero.webp"
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="-z-20 object-cover object-[65%_center]"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/90 via-slate-950/65 to-slate-950/10"
        />
        <div className="max-w-container pt-16 pb-32 md:pt-24 md:pb-40 lg:pt-28 lg:pb-44">
          <div className="max-w-2xl">
            <p className="text-heat-soft text-xs font-semibold tracking-[0.25em] uppercase">{t("eyebrow")}</p>
            <h1 className="mt-4 text-4xl leading-[1.05] font-bold tracking-tight text-balance md:text-6xl">
              {t("title")}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">{t("description")}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/kontakti?tema=ogled"
                className="bg-heat text-heat-foreground hover:bg-heat/90 inline-flex h-12 items-center rounded-full px-7 text-sm font-semibold shadow-lg shadow-black/20 transition-colors"
              >
                {t("primary")}
              </Link>
              <Link
                href="/products"
                className="inline-flex h-12 items-center rounded-full border border-white/40 px-7 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                {t("secondary")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-container relative z-10 -mt-20 md:-mt-24" aria-label={t("solutions")}>
        <ul className="grid gap-3 md:grid-cols-3 md:gap-4">
          {HERO_SYSTEMS.map((system) => (
            <li key={system.slug}>
              <Link
                href={installationHref(system.slug)}
                className="group bg-background flex h-full items-center gap-4 rounded-2xl p-3 shadow-xl ring-1 shadow-black/10 ring-black/5 transition-transform hover:-translate-y-1"
              >
                <span className="bg-muted relative h-20 w-24 shrink-0 overflow-hidden rounded-xl md:h-24 md:w-28">
                  <Image
                    src={system.image}
                    alt=""
                    fill
                    sizes="112px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{ti(`${system.slug}.title`)}</span>
                  <span className="text-muted-foreground mt-0.5 block text-sm leading-snug">
                    {ti(`${system.slug}.short`)}
                  </span>
                  <span className="text-primary mt-2 inline-flex items-center gap-1 text-xs font-semibold">
                    {t("solutionLink")}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
};

export { HomeHero };
