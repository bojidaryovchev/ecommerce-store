import { ContactForm } from "@/components/contact";
import { CONTACT_EMAIL } from "@/constants";
import { Link } from "@/i18n/navigation";
import { isInstallationSystem } from "@/lib/installation-systems";
import { ArrowRight, Mail } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import React from "react";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tema?: string; sistema?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact.meta" });
  return { title: t("title"), description: t("description"), alternates: { canonical: "/kontakti" } };
}

const ContactPage: React.FC<Props> = async ({ params, searchParams }) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const { tema, sistema } = await searchParams;
  const t = await getTranslations("contact");
  const next = t.raw("aside.next") as string[];

  return (
    <main className="max-w-container py-12 md:py-16">
      <div className="max-w-2xl">
        <p className="text-heat text-xs font-semibold tracking-[0.2em] uppercase">{t("eyebrow")}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance md:text-5xl">{t("title")}</h1>
        <p className="text-muted-foreground mt-4 text-lg leading-relaxed">{t("lead")}</p>
      </div>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_22rem] lg:gap-12">
        <ContactForm
          topic={tema === "ogled" ? "ogled" : "vapros"}
          system={sistema && isInstallationSystem(sistema) ? sistema : undefined}
        />

        <aside className="space-y-8 lg:sticky lg:top-32">
          <section>
            <h2 className="font-semibold">{t("aside.writeTitle")}</h2>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-primary mt-2 inline-flex items-center gap-2 font-medium hover:underline"
            >
              <Mail className="size-4" aria-hidden />
              {CONTACT_EMAIL}
            </a>
            <p className="text-muted-foreground mt-2 text-sm">{t("aside.writeText")}</p>
          </section>
          <section>
            <h2 className="font-semibold">{t("aside.nextTitle")}</h2>
            <ol className="mt-3 space-y-3">
              {next.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm">
                  <span className="bg-heat text-heat-foreground grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </section>
          <section className="bg-muted/60 rounded-2xl p-5">
            <h2 className="font-semibold">{t("aside.guidesTitle")}</h2>
            <p className="text-muted-foreground mt-1 text-sm">{t("aside.guidesText")}</p>
            <Link
              href="/saveti"
              className="text-primary mt-3 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
            >
              {t("aside.guidesLink")}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </section>
        </aside>
      </div>
    </main>
  );
};

export default ContactPage;
