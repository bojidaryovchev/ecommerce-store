import { ProductCard } from "@/components/products";
import { JsonLd } from "@/components/seo";
import { findGuide, guideHref, GUIDES, guideText } from "@/content/guides";
import { Link } from "@/i18n/navigation";
import { installationHref } from "@/lib/installation-systems";
import { SITE_URL } from "@/lib/site-url";
import { getCategoryProducts } from "@/queries/products";
import { ArrowRight, Calculator, ChevronRight, Clock, Wrench } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { notFound } from "next/navigation";
import React from "react";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const guide = findGuide(slug);
  if (!guide) return {};
  const text = guideText(guide, locale);
  return {
    title: text.title,
    description: text.excerpt,
    alternates: { canonical: guideHref(slug) },
    openGraph: { type: "article", images: [guide.image] },
  };
}

const anchor = (index: number) => `razdel-${index + 1}`;

const GuidePage: React.FC<Props> = async ({ params }) => {
  const { locale, slug } = await params;
  const guide = findGuide(slug);
  if (!guide) notFound();
  setRequestLocale(locale);
  const text = guideText(guide, locale);
  const [t, products] = await Promise.all([
    getTranslations("guides"),
    guide.categorySlug ? getCategoryProducts(guide.categorySlug, 4) : Promise.resolve([]),
  ]);
  const others = GUIDES.filter((other) => other.slug !== guide.slug).slice(0, 3);

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: text.title,
          description: text.excerpt,
          image: `${SITE_URL}${guide.image}`,
          inLanguage: locale,
          mainEntityOfPage: `${SITE_URL}${locale === "en" ? "/en" : ""}${guideHref(guide.slug)}`,
        }}
      />
      <article className="max-w-container py-10 md:py-14">
        <nav aria-label="breadcrumb" className="text-muted-foreground flex items-center gap-1.5 text-sm">
          <Link href="/" className="hover:text-foreground">
            {t("home")}
          </Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <Link href={guideHref()} className="hover:text-foreground">
            {t("eyebrow")}
          </Link>
        </nav>

        <header className="mt-6 max-w-3xl">
          <h1 className="text-4xl leading-tight font-bold tracking-tight text-balance md:text-5xl">{text.title}</h1>
          <p className="text-muted-foreground mt-4 flex items-center gap-1.5 text-sm">
            <Clock className="size-4" aria-hidden />
            {t("minutes", { count: guide.readingMinutes })}
          </p>
          <p className="mt-5 text-xl leading-relaxed">{text.excerpt}</p>
        </header>

        <div className="relative mt-8 aspect-[21/9] overflow-hidden rounded-3xl">
          <Image src={guide.image} alt="" fill priority sizes="100vw" className="object-cover" />
        </div>

        <div className="mt-12 grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="max-w-3xl">
            <nav aria-label={t("contents")} className="bg-muted/60 rounded-2xl p-5">
              <p className="text-sm font-semibold">{t("contents")}</p>
              <ol className="mt-2 space-y-1.5">
                {text.sections.map((section, index) => (
                  <li key={section.heading}>
                    <a href={`#${anchor(index)}`} className="text-primary text-sm hover:underline">
                      {index + 1}. {section.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            {text.sections.map((section, index) => (
              <section key={section.heading} id={anchor(index)} className="mt-10 scroll-mt-32">
                <h2 className="text-2xl font-bold tracking-tight">{section.heading}</h2>
                {section.paragraphs.map((paragraph, i) => (
                  <React.Fragment key={paragraph}>
                    <p className="mt-4 text-lg leading-relaxed">{paragraph}</p>
                    {section.list && i === 0 && (
                      <ul className="mt-4 space-y-2">
                        {section.list.map((item) => (
                          <li key={item} className="flex gap-3 text-lg leading-relaxed">
                            <span className="bg-heat mt-2.5 size-2 shrink-0 rounded-full" aria-hidden />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </React.Fragment>
                ))}
              </section>
            ))}
            <p className="text-muted-foreground mt-10 border-t pt-6 text-sm">{t("note")}</p>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-32">
            {guide.installation && (
              <Link
                href={installationHref(guide.installation)}
                className="group bg-card block rounded-2xl border p-5 transition-shadow hover:shadow-lg"
              >
                <Wrench className="text-heat size-6" aria-hidden />
                <p className="mt-3 font-semibold">{t("installation")}</p>
                <p className="text-muted-foreground mt-1 text-sm">{t("installationText")}</p>
                <ArrowRight
                  className="text-primary mt-3 size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            )}
            {guide.calculator && (
              <Link
                href={`/kalkulatori/${guide.calculator}`}
                className="group bg-card block rounded-2xl border p-5 transition-shadow hover:shadow-lg"
              >
                <Calculator className="text-heat size-6" aria-hidden />
                <p className="mt-3 font-semibold">{t("calculator")}</p>
                <p className="text-muted-foreground mt-1 text-sm">{t("calculatorText")}</p>
                <ArrowRight
                  className="text-primary mt-3 size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            )}
            <div className="bg-heat-soft rounded-2xl p-5">
              <p className="font-semibold">{t("visitTitle")}</p>
              <p className="text-muted-foreground mt-1 text-sm">{t("visitText")}</p>
              <Link
                href={`/kontakti?tema=ogled${guide.installation ? `&sistema=${guide.installation}` : ""}`}
                className="bg-heat text-heat-foreground hover:bg-heat/90 mt-4 inline-flex h-10 items-center rounded-full px-5 text-sm font-semibold transition-colors"
              >
                {t("visitLink")}
              </Link>
            </div>
          </aside>
        </div>
      </article>

      {products.length > 0 && guide.categorySlug && (
        <section className="max-w-container pb-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight">{t("products")}</h2>
            <Link
              href={`/${guide.categorySlug}`}
              className="text-primary inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
            >
              {t("productsLink")}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="max-w-container border-t py-14">
        <h2 className="text-2xl font-bold tracking-tight">{t("more")}</h2>
        <ul className="mt-6 grid gap-6 md:grid-cols-3">
          {others.map((other) => (
            <li key={other.slug}>
              <Link href={guideHref(other.slug)} className="group flex gap-4">
                <span className="bg-muted relative size-20 shrink-0 overflow-hidden rounded-xl">
                  <Image src={other.image} alt="" fill sizes="80px" className="object-cover" />
                </span>
                <span className="group-hover:text-primary leading-snug font-semibold transition-colors">
                  {guideText(other, locale).title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
};

export default GuidePage;
