import { JsonLd } from "@/components/seo";
import { CONTACT_EMAIL } from "@/constants";
import {
  INFO_SLUGS,
  infoHref,
  infoNav,
  infoText,
  LEGAL_DRAFT,
  LEGAL_UPDATED,
  WITHDRAWAL_HREF,
  type InfoSlug,
} from "@/content/legal";
import { Link } from "@/i18n/navigation";
import { localizedAlternates } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-url";
import { cn } from "@/lib/utils";
import { ArrowRight, ChevronRight, FileWarning, Undo2 } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import React from "react";

export function infoMetadata(slug: InfoSlug, locale: string): Metadata {
  const text = infoText(slug, locale);
  return { title: text.title, description: text.description, alternates: localizedAlternates(infoHref(slug), locale) };
}

const anchor = (index: number) => `razdel-${index + 1}`;

/** The button that opens the online withdrawal form: on the returns page and the order pages. */
export const WithdrawalCallout: React.FC<{ className?: string }> = async ({ className }) => {
  const t = await getTranslations("info.withdrawalCta");
  return (
    <div className={cn("bg-heat-soft flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-center", className)}>
      <Undo2 className="text-heat size-8 shrink-0" aria-hidden />
      <div className="flex-1">
        <p className="font-semibold">{t("title")}</p>
        <p className="text-muted-foreground mt-1 text-sm">{t("text")}</p>
      </div>
      <Link
        href={WITHDRAWAL_HREF}
        className="bg-heat text-heat-foreground hover:bg-heat/90 inline-flex h-11 shrink-0 items-center justify-center rounded-full px-6 text-sm font-semibold transition-colors"
      >
        {t("button")}
      </Link>
    </div>
  );
};

/** The side menu shared by the information pages, and the way to reach us. */
export const InfoNav: React.FC<{ current?: InfoSlug | "otkaz"; locale: string }> = async ({ current, locale }) => {
  const t = await getTranslations("info");
  return (
    <div className="space-y-6">
      <nav aria-label={t("navTitle")}>
        <p className="text-muted-foreground text-xs font-semibold tracking-[0.15em] uppercase">{t("navTitle")}</p>
        <ul className="mt-3 space-y-0.5">
          {INFO_SLUGS.map((slug) => (
            <li key={slug}>
              <Link
                href={infoHref(slug)}
                aria-current={slug === current ? "page" : undefined}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm transition-colors",
                  slug === current ? "bg-primary/5 text-primary font-semibold" : "hover:bg-muted",
                )}
              >
                {infoNav(slug, locale)}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href={WITHDRAWAL_HREF}
              aria-current={current === "otkaz" ? "page" : undefined}
              className={cn(
                "block rounded-lg px-3 py-2 text-sm transition-colors",
                current === "otkaz" ? "bg-primary/5 text-primary font-semibold" : "hover:bg-muted",
              )}
            >
              {t("footer.withdrawal")}
            </Link>
          </li>
        </ul>
      </nav>
      <div className="bg-muted/60 rounded-2xl p-5">
        <p className="font-semibold">{t("help.title")}</p>
        <p className="text-muted-foreground mt-1 text-sm">{t("help.text")}</p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-primary mt-3 block text-[13px] font-medium [overflow-wrap:anywhere] hover:underline"
        >
          {CONTACT_EMAIL}
        </a>
        <Link
          href="/kontakti"
          className="text-primary mt-2 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
        >
          {t("help.link")}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
};

/** One information page (delivery, returns, terms…): the text from content/legal.ts and the side menu. */
const InfoPage: React.FC<{ slug: InfoSlug; locale: string }> = async ({ slug, locale }) => {
  const [t, format] = await Promise.all([getTranslations("info"), getFormatter()]);
  const text = infoText(slug, locale);
  const path = `${locale === "en" ? "/en" : ""}${infoHref(slug)}`;

  return (
    <main className="max-w-container py-10 md:py-14">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: t("home"), item: `${SITE_URL}${locale === "en" ? "/en" : "/"}` },
            { "@type": "ListItem", position: 2, name: text.title, item: `${SITE_URL}${path}` },
          ],
        }}
      />
      <nav aria-label="breadcrumb" className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <Link href="/" className="hover:text-foreground">
          {t("home")}
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span>{t("section")}</span>
      </nav>

      <div className="mt-6 grid items-start gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14">
        <article className="max-w-3xl lg:order-last">
          <header>
            <h1 className="text-4xl leading-tight font-bold tracking-tight text-balance md:text-5xl">{text.title}</h1>
            <p className="mt-4 text-xl leading-relaxed">{text.description}</p>
            <p className="text-muted-foreground mt-3 text-sm">
              {t("updated", { date: format.dateTime(new Date(LEGAL_UPDATED), { dateStyle: "long" }) })}
            </p>
          </header>

          {LEGAL_DRAFT && slug !== "za-nas" && (
            <p className="mt-6 flex gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
              <FileWarning className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t("draft")}
            </p>
          )}

          {slug === "vrashtane" && <WithdrawalCallout className="mt-6" />}

          {text.sections.length > 3 && (
            <nav aria-label={t("contents")} className="bg-muted/60 mt-8 rounded-2xl p-5">
              <p className="text-sm font-semibold">{t("contents")}</p>
              <ol className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                {text.sections.map((section, index) => (
                  <li key={section.heading}>
                    <a href={`#${anchor(index)}`} className="text-primary text-sm hover:underline">
                      {index + 1}. {section.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {text.sections.map((section, index) => (
            <section key={section.heading} id={anchor(index)} className="mt-10 scroll-mt-32">
              <h2 className="text-2xl font-bold tracking-tight">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-4 text-lg leading-relaxed">
                  {paragraph}
                </p>
              ))}
              {section.list && (
                <ul className="mt-4 space-y-2">
                  {section.list.map((item) => (
                    <li key={item} className="flex gap-3 text-lg leading-relaxed">
                      <span className="bg-heat mt-2.5 size-2 shrink-0 rounded-full" aria-hidden />
                      <span className="min-w-0 break-words">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>

        <aside className="lg:sticky lg:top-32">
          <InfoNav current={slug} locale={locale} />
        </aside>
      </div>
    </main>
  );
};

export { InfoPage };
