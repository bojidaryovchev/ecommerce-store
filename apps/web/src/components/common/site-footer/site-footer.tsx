import { CONTACT_EMAIL } from "@/constants";
import { guideHref, GUIDES, guideText } from "@/content/guides";
import { INFO_SLUGS, infoHref, infoNav, WITHDRAWAL_HREF } from "@/content/legal";
import { Link } from "@/i18n/navigation";
import { TOOLS } from "@/lib/calculators";
import { buildCategoryMenu } from "@/lib/category-tree";
import { INSTALLATION_SYSTEMS, installationHref } from "@/lib/installation-systems";
import { categoryHref } from "@/lib/routes";
import { getCategoryIndex, getCategoryStats } from "@/queries/categories";
import { ClipboardCheck, CreditCard, Flame, Mail, Snowflake, Truck, Wrench } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import React from "react";

const linkClass = "text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors";

const Column: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <nav aria-label={title}>
    <p className="text-sm font-semibold">{title}</p>
    <ul className="mt-4 space-y-2.5">{children}</ul>
  </nav>
);

/**
 * Site footer: the shop's promises, every section of the site (server-rendered, so crawlers see
 * every category and page), the legal pages and the withdrawal form, which must be easy to find.
 */
const SiteFooter: React.FC = async () => {
  const [categories, stats, locale, t, tNav, tInfo, tInstall, tTools, tMeta] = await Promise.all([
    getCategoryIndex(),
    getCategoryStats(),
    getLocale(),
    getTranslations("navigation.footer"),
    getTranslations("navigation.navbar"),
    getTranslations("info"),
    getTranslations("installation.systems"),
    getTranslations("tools"),
    getTranslations("metadata"),
  ]);
  const menu = buildCategoryMenu(categories, categoryHref, stats);
  const promises = [
    { icon: Truck, title: t("promises.delivery"), text: t("promises.deliveryText") },
    { icon: Wrench, title: t("promises.installation"), text: t("promises.installationText") },
    { icon: ClipboardCheck, title: t("promises.visit"), text: t("promises.visitText") },
    { icon: CreditCard, title: t("promises.payment"), text: t("promises.paymentText") },
  ];

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="border-primary-foreground/10 border-b">
        <ul className="max-w-container grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {promises.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4">
              <span className="bg-primary-foreground/10 grid size-11 shrink-0 place-items-center rounded-xl">
                <Icon className="text-heat size-5" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-semibold">{title}</span>
                <span className="text-primary-foreground/65 mt-0.5 block text-sm">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="max-w-container grid gap-12 py-14 lg:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))] lg:gap-8">
        <div className="max-w-sm">
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label={tNav("brand")}>
            <span className="bg-primary-foreground/10 relative grid size-10 place-items-center overflow-hidden rounded-xl">
              <Flame className="text-heat absolute -top-0.5 -left-0.5 size-6" aria-hidden />
              <Snowflake className="text-primary-foreground absolute -right-0.5 -bottom-0.5 size-5" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block font-bold tracking-tight">{tNav("brand")}</span>
              <span className="text-primary-foreground/60 block text-xs">{tMeta("tagline")}</span>
            </span>
          </Link>
          <p className="text-primary-foreground/70 mt-5 text-sm leading-relaxed">{t("about")}</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-primary-foreground mt-5 inline-flex items-center gap-2 text-sm font-medium hover:underline"
          >
            <Mail className="text-heat size-4" aria-hidden />
            {CONTACT_EMAIL}
          </a>
          <div className="mt-6">
            <Link
              href="/kontakti?tema=ogled"
              className="bg-heat text-heat-foreground hover:bg-heat/90 inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold transition-colors"
            >
              {tNav("requestVisit")}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:contents">
          <Column title={tNav("products")}>
            {menu.map((root) => (
              <li key={root.id}>
                <Link href={root.href} className={linkClass}>
                  {root.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/categories" className={linkClass}>
                {t("allCategories")}
              </Link>
            </li>
            <li>
              <Link href="/products" className="text-heat text-sm font-semibold hover:underline">
                {t("allProducts")}
              </Link>
            </li>
          </Column>

          <Column title={tNav("installation")}>
            {INSTALLATION_SYSTEMS.map((system) => (
              <li key={system.slug}>
                <Link href={installationHref(system.slug)} className={linkClass}>
                  {tInstall(`${system.slug}.title`)}
                </Link>
              </li>
            ))}
            <li>
              <Link href={installationHref()} className={linkClass}>
                {tNav("howWeWork")}
              </Link>
            </li>
            <li>
              <Link href="/kontakti?tema=ogled" className={linkClass}>
                {tNav("requestVisit")}
              </Link>
            </li>
          </Column>

          <Column title={t("guidesAndTools")}>
            {GUIDES.slice(0, 4).map((guide) => (
              <li key={guide.slug}>
                <Link href={guideHref(guide.slug)} className={linkClass}>
                  {guideText(guide, locale).title}
                </Link>
              </li>
            ))}
            <li>
              <Link href={guideHref()} className={linkClass}>
                {t("allGuides")}
              </Link>
            </li>
            {TOOLS.map((tool) => (
              <li key={tool}>
                <Link href={`/kalkulatori/${tool}`} className={linkClass}>
                  {tTools(`${tool}.title`)}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/kalkulatori" className={linkClass}>
                {t("allTools")}
              </Link>
            </li>
          </Column>

          <Column title={tInfo("navTitle")}>
            {INFO_SLUGS.map((slug) => (
              <li key={slug}>
                <Link href={infoHref(slug)} className={linkClass}>
                  {infoNav(slug, locale)}
                </Link>
              </li>
            ))}
            <li>
              <Link href={WITHDRAWAL_HREF} className={linkClass}>
                {tInfo("footer.withdrawal")}
              </Link>
            </li>
            <li>
              <Link href="/kontakti" className={linkClass}>
                {tNav("contact")}
              </Link>
            </li>
            <li>
              <Link href="/account/orders" className={linkClass}>
                {t("orders")}
              </Link>
            </li>
          </Column>
        </div>
      </div>

      <div className="border-primary-foreground/10 border-t">
        <div className="max-w-container text-primary-foreground/60 flex flex-col gap-2 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>{t("rights", { name: tNav("brand") })}</p>
          <p>
            {t("prices")} {t("payments")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export { SiteFooter };
