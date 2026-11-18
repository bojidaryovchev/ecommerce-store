"use client";

import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { usePathname as useNextPathname, useSearchParams } from "next/navigation";
import React from "react";

/** Each language is named in itself (not translated), so shoppers can find theirs whatever language the page is in. */
const LANGUAGES: Record<Locale, { short: string; name: string }> = {
  bg: { short: "БГ", name: "Български" },
  en: { short: "EN", name: "English" },
};

type LocaleSwitcherProps = {
  className?: string;
  /** Called when a switch starts, e.g. to close the mobile menu. */
  onLocaleChange?: () => void;
};

/**
 * The other language as a real link (an <a href hreflang>), so crawlers find each page's other version
 * and the visitor stays on the same page with the same query.
 */
const LocaleSwitcher: React.FC<LocaleSwitcherProps> = ({ className, onLocaleChange }) => {
  const t = useTranslations("navigation.localeSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const nextPathname = useNextPathname();
  const searchParams = useSearchParams();

  // The navbar also renders in the admin, which is English-only and outside the locale routing.
  if (nextPathname === "/admin" || nextPathname.startsWith("/admin/")) {
    return null;
  }

  const query = searchParams.toString();
  const href = query ? `${pathname}?${query}` : pathname;

  return (
    <div role="group" aria-label={t("label")} className={cn("flex items-center gap-1", className)}>
      {routing.locales.map((option) =>
        option === locale ? (
          <Button key={option} asChild variant="secondary" size="sm" className="px-2">
            <span lang={option} aria-label={LANGUAGES[option].name} aria-current="true">
              {LANGUAGES[option].short}
            </span>
          </Button>
        ) : (
          <Button key={option} asChild variant="ghost" size="sm" className="text-muted-foreground px-2">
            <Link
              href={href}
              locale={option}
              lang={option}
              hrefLang={option}
              aria-label={LANGUAGES[option].name}
              onClick={() => onLocaleChange?.()}
            >
              {LANGUAGES[option].short}
            </Link>
          </Button>
        ),
      )}
    </div>
  );
};

export { LocaleSwitcher };
