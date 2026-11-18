import { CONTACT_EMAIL } from "@/constants";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import React from "react";

const ContactBand: React.FC = async () => {
  const t = await getTranslations("home.cta");
  return (
    <section className="max-w-container pb-20">
      <div className="bg-heat-soft relative overflow-hidden rounded-3xl px-6 py-12 md:px-14 md:py-16">
        <div aria-hidden className="bg-heat/15 absolute -top-24 -right-24 size-72 rounded-full blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold tracking-tight text-balance">{t("title")}</h2>
            <p className="text-muted-foreground mt-3 text-lg">{t("text")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/kontakti?tema=ogled"
              className="bg-heat text-heat-foreground hover:bg-heat/90 inline-flex h-12 items-center rounded-full px-7 text-sm font-semibold shadow-lg shadow-black/10 transition-colors"
            >
              {t("primary")}
            </Link>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="bg-background inline-flex h-12 items-center rounded-full px-7 text-sm font-semibold shadow-sm ring-1 ring-black/10 transition-colors hover:ring-black/20"
            >
              {t("secondary")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export { ContactBand };
