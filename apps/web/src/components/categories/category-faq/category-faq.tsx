import { routing } from "@/i18n/routing";
import { getCategoryFaq } from "@/queries/categories";
import { ChevronDown } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import React from "react";

interface Props {
  categoryId: string;
  categoryName: string;
}

/**
 * The category's questions and answers, under its products. Only on the Bulgarian pages: the questions are written
 * in Bulgarian. No FAQPage markup, which earns no search feature: the questions are for the readers. Native
 * <details>, as on the home page: they work without JavaScript and are read by search engines and screen readers.
 */
const CategoryFaq: React.FC<Props> = async ({ categoryId, categoryName }) => {
  const [locale, items] = await Promise.all([getLocale(), getCategoryFaq(categoryId)]);
  if (locale !== routing.defaultLocale || items.length === 0) return null;
  const t = await getTranslations("categories.faq");

  return (
    <section
      aria-labelledby="category-faq"
      className="grid items-start gap-6 border-t pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-10"
    >
      <div className="lg:sticky lg:top-32">
        <p className="text-primary text-sm font-semibold tracking-wider uppercase">{categoryName}</p>
        <h2 id="category-faq" className="mt-1 text-2xl font-bold tracking-tight text-balance">
          {t("title")}
        </h2>
      </div>
      <div className="divide-y rounded-2xl border">
        {items.map((item) => (
          <details key={item.question} className="group px-5 py-1 md:px-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 font-medium [&::-webkit-details-marker]:hidden">
              {item.question}
              <ChevronDown
                className="text-muted-foreground size-5 shrink-0 transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="text-muted-foreground pb-5 leading-relaxed">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
};

export { CategoryFaq };
