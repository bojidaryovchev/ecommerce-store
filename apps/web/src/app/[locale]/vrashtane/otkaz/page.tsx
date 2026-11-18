import { InfoNav, WithdrawalForm } from "@/components/info";
import { infoHref, infoNav, WITHDRAWAL_HREF } from "@/content/legal";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { localizedAlternates } from "@/lib/seo";
import { ArrowRight, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import React from "react";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ poruchka?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "info.withdrawal.meta" });
  return { title: t("title"), description: t("description"), alternates: localizedAlternates(WITHDRAWAL_HREF, locale) };
}

/** The online withdrawal function: the form, the rules in short, and the full returns page. */
const WithdrawalPage: React.FC<Props> = async ({ params, searchParams }) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const [{ poruchka }, session, t, tInfo] = await Promise.all([
    searchParams,
    auth(),
    getTranslations("info.withdrawal"),
    getTranslations("info"),
  ]);
  const order = poruchka && /^[0-9a-f]{8}$/i.test(poruchka) ? poruchka.toUpperCase() : undefined;
  const rules = t.raw("rulesList") as string[];

  return (
    <main className="max-w-container py-10 md:py-14">
      <nav aria-label="breadcrumb" className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm">
        <Link href="/" className="hover:text-foreground">
          {tInfo("home")}
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <Link href={infoHref("vrashtane")} className="hover:text-foreground">
          {infoNav("vrashtane", locale)}
        </Link>
      </nav>

      <div className="mt-6 grid items-start gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14">
        <div className="lg:order-last">
          <header className="max-w-3xl">
            <p className="text-heat text-xs font-semibold tracking-[0.2em] uppercase">{t("eyebrow")}</p>
            <h1 className="mt-3 text-4xl leading-tight font-bold tracking-tight text-balance md:text-5xl">
              {t("title")}
            </h1>
            <p className="text-muted-foreground mt-4 text-lg leading-relaxed">{t("lead")}</p>
          </header>

          <div className="mt-8 grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
            <WithdrawalForm
              order={order}
              name={session?.user?.name ?? undefined}
              email={session?.user?.email ?? undefined}
            />
            <section className="bg-muted/60 rounded-2xl p-5">
              <h2 className="font-semibold">{t("rules")}</h2>
              <ol className="mt-3 space-y-3">
                {rules.map((rule, index) => (
                  <li key={rule} className="flex gap-3 text-sm">
                    <span className="bg-heat text-heat-foreground grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground pt-0.5">{rule}</span>
                  </li>
                ))}
              </ol>
              <Link
                href={infoHref("vrashtane")}
                className="text-primary mt-4 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
              >
                {t("rulesLink")}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </section>
          </div>
        </div>

        <aside className="lg:sticky lg:top-32">
          <InfoNav current="otkaz" locale={locale} />
        </aside>
      </div>
    </main>
  );
};

export default WithdrawalPage;
