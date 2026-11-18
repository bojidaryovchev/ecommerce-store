import { ContactForm } from "@/components/contact";
import { InstallationStory } from "@/components/installation";
import { ProductCard } from "@/components/products";
import { JsonLd } from "@/components/seo";
import { findGuide, guideHref, guideText } from "@/content/guides";
import { INSTALLATIONS, installationText } from "@/content/installations";
import { Link } from "@/i18n/navigation";
import { INSTALLATION_SYSTEMS, installationHref, isInstallationSystem } from "@/lib/installation-systems";
import { localizedAlternates } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-url";
import { getCategoryProducts } from "@/queries/products";
import { ArrowRight, Calculator, Check, ChevronDown, ChevronRight, ClipboardList } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { notFound } from "next/navigation";
import React from "react";

type Props = {
  params: Promise<{ locale: string; system: string }>;
};

export function generateStaticParams() {
  return INSTALLATION_SYSTEMS.map((system) => ({ system: system.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, system } = await params;
  if (!isInstallationSystem(system)) return {};
  const text = installationText(INSTALLATIONS[system], locale);
  return {
    title: text.title,
    description: text.metaDescription,
    alternates: localizedAlternates(installationHref(system), locale),
    openGraph: { images: [INSTALLATION_SYSTEMS.find((entry) => entry.slug === system)!.image] },
  };
}

const InstallationPage: React.FC<Props> = async ({ params }) => {
  const { locale, system } = await params;
  if (!isInstallationSystem(system)) notFound();
  setRequestLocale(locale);

  const content = INSTALLATIONS[system];
  const text = installationText(content, locale);
  const entry = INSTALLATION_SYSTEMS.find((candidate) => candidate.slug === system)!;
  const [t, products] = await Promise.all([
    getTranslations("installation.page"),
    getCategoryProducts(entry.categorySlug, 4),
  ]);
  const guide = content.guide ? findGuide(content.guide) : undefined;
  const chips = t.raw("chips") as string[];
  const requestHref = `/kontakti?tema=ogled&sistema=${system}`;

  const prefix = locale === "en" ? "/en" : "";

  return (
    <main>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: text.title,
            description: text.metaDescription,
            serviceType: text.title,
            areaServed: { "@type": "Country", name: "Bulgaria" },
            provider: { "@id": `${SITE_URL}/#organization` },
            url: `${SITE_URL}${prefix}${installationHref(system)}`,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: t("breadcrumbHome"), item: `${SITE_URL}${prefix || "/"}` },
              {
                "@type": "ListItem",
                position: 2,
                name: t("breadcrumbInstallation"),
                item: `${SITE_URL}${prefix}/montazh`,
              },
              { "@type": "ListItem", position: 3, name: text.title },
            ],
          },
        ]}
      />

      <section className="max-w-container grid items-center gap-10 py-10 md:py-14 lg:grid-cols-2 lg:gap-14">
        <div>
          <nav aria-label="breadcrumb" className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <Link href="/" className="hover:text-foreground">
              {t("breadcrumbHome")}
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <Link href={installationHref()} className="hover:text-foreground">
              {t("breadcrumbInstallation")}
            </Link>
          </nav>
          <p className="text-heat mt-6 text-xs font-semibold tracking-[0.2em] uppercase">{t("eyebrow")}</p>
          <h1 className="mt-3 text-4xl leading-tight font-bold tracking-tight text-balance md:text-5xl">
            {text.title}
          </h1>
          <p className="text-muted-foreground mt-5 text-lg leading-relaxed">{text.lead}</p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <li
                key={chip}
                className="bg-muted inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
              >
                <Check className="text-heat size-4" aria-hidden />
                {chip}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={requestHref}
              className="bg-heat text-heat-foreground hover:bg-heat/90 inline-flex h-12 items-center rounded-full px-7 text-sm font-semibold shadow-lg shadow-black/10 transition-colors"
            >
              {t("primary")}
            </Link>
            <Link
              href={`/${entry.categorySlug}`}
              className="hover:bg-accent inline-flex h-12 items-center rounded-full border px-7 text-sm font-semibold transition-colors"
            >
              {t("secondary")}
            </Link>
          </div>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
          <Image
            src={entry.image}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </section>

      <InstallationStory
        system={system}
        eyebrow={text.storyEyebrow}
        title={text.storyTitle}
        beats={text.beats}
        stages={content.stages}
      />

      <section className="max-w-container grid gap-6 py-16 md:grid-cols-2 md:py-20">
        <div className="bg-card rounded-3xl border p-7 md:p-9">
          <h2 className="text-2xl font-bold tracking-tight">{t("includedTitle")}</h2>
          <ul className="mt-6 space-y-3">
            {text.included.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="bg-heat/10 text-heat mt-0.5 grid size-6 shrink-0 place-items-center rounded-full">
                  <Check className="size-4" aria-hidden />
                </span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-6 text-sm">{t("scopeNote")}</p>
        </div>
        <div className="bg-muted/60 rounded-3xl p-7 md:p-9">
          <h2 className="text-2xl font-bold tracking-tight">{t("needTitle")}</h2>
          <ul className="mt-6 space-y-3">
            {text.need.map((item) => (
              <li key={item} className="flex gap-3">
                <ClipboardList className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {products.length > 0 && (
        <section className="max-w-container pb-16 md:pb-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-heat text-xs font-semibold tracking-[0.2em] uppercase">{t("productsEyebrow")}</p>
              <h2 className="mt-2.5 text-3xl font-bold tracking-tight">{t("productsTitle")}</h2>
            </div>
            <Link
              href={`/${entry.categorySlug}`}
              className="text-primary inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
            >
              {t("productsLink")}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <ul className="mt-8 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {(guide || content.calculator) && (
        <section className="max-w-container pb-16 md:pb-20">
          <h2 className="text-2xl font-bold tracking-tight">{t("moreTitle")}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {guide && (
              <Link
                href={guideHref(guide.slug)}
                className="group bg-card flex items-center gap-5 rounded-2xl border p-4 transition-shadow hover:shadow-lg"
              >
                <span className="bg-muted relative h-24 w-32 shrink-0 overflow-hidden rounded-xl">
                  <Image src={guide.image} alt="" fill sizes="128px" className="object-cover" />
                </span>
                <span>
                  <span className="text-heat text-xs font-semibold tracking-wider uppercase">{t("guideLabel")}</span>
                  <span className="group-hover:text-primary mt-1 block font-semibold">
                    {guideText(guide, locale).title}
                  </span>
                </span>
              </Link>
            )}
            {content.calculator && (
              <Link
                href={`/kalkulatori/${content.calculator}`}
                className="group bg-card flex items-center gap-5 rounded-2xl border p-4 transition-shadow hover:shadow-lg"
              >
                <span className="bg-primary/5 text-primary grid h-24 w-32 shrink-0 place-items-center rounded-xl">
                  <Calculator className="size-9" aria-hidden />
                </span>
                <span>
                  <span className="text-heat text-xs font-semibold tracking-wider uppercase">
                    {t("calculatorLabel")}
                  </span>
                  <span className="group-hover:text-primary mt-1 block font-semibold">{t("calculatorTitle")}</span>
                </span>
              </Link>
            )}
          </div>
        </section>
      )}

      <section className="max-w-container pb-16 md:pb-20">
        <h2 className="text-2xl font-bold tracking-tight">{t("faqTitle")}</h2>
        <div className="mt-6 divide-y rounded-2xl border">
          {text.faq.map((item) => (
            <details key={item.q} className="group px-5 py-1 md:px-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 font-medium [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown
                  className="text-muted-foreground size-5 shrink-0 transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="text-muted-foreground pb-5 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="zayavka" className="bg-muted/50 border-t py-16 md:py-20">
        <div className="max-w-container grid items-start gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="lg:sticky lg:top-32">
            <p className="text-heat text-xs font-semibold tracking-[0.2em] uppercase">{t("requestEyebrow")}</p>
            <h2 className="mt-2.5 text-3xl font-bold tracking-tight">{t("requestTitle")}</h2>
            <p className="text-muted-foreground mt-3 text-lg leading-relaxed">{t("requestLead")}</p>
          </div>
          <ContactForm topic="ogled" system={system} />
        </div>
      </section>
    </main>
  );
};

export default InstallationPage;
