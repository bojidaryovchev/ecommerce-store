import { ChevronDown } from "lucide-react";
import { getTranslations } from "next-intl/server";
import React from "react";
import { SectionHeading } from "./section-heading";

const QUESTIONS = ["install", "vat", "delivery", "power", "returns", "payment"] as const;

/** Native <details>: works without JavaScript and is read by search engines and screen readers. */
const HomeFaq: React.FC = async () => {
  const t = await getTranslations("home.faq");
  return (
    <section className="max-w-container grid items-start gap-10 py-16 md:py-20 lg:grid-cols-[1fr_2fr]">
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} className="lg:sticky lg:top-32" />
      <div className="divide-y rounded-2xl border">
        {QUESTIONS.map((key) => (
          <details key={key} className="group px-5 py-1 md:px-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 font-medium [&::-webkit-details-marker]:hidden">
              {t(`items.${key}.q`)}
              <ChevronDown
                className="text-muted-foreground size-5 shrink-0 transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="text-muted-foreground pb-5 leading-relaxed">{t(`items.${key}.a`)}</p>
          </details>
        ))}
      </div>
    </section>
  );
};

export { HomeFaq };
