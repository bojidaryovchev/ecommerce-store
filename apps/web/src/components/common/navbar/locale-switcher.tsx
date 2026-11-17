"use client";

import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { usePathname as useNextPathname, useSearchParams } from "next/navigation";
import React, { useTransition } from "react";

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

const LocaleSwitcher: React.FC<LocaleSwitcherProps> = ({ className, onLocaleChange }) => {
  const t = useTranslations("navigation.localeSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const nextPathname = useNextPathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // The navbar also renders in the admin, which is English-only and outside the locale routing.
  if (nextPathname === "/admin" || nextPathname.startsWith("/admin/")) {
    return null;
  }

  const switchLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) return;

    const query = searchParams.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { locale: nextLocale });
    });
    onLocaleChange?.();
  };

  return (
    <div role="group" aria-label={t("label")} className={cn("flex items-center gap-1", className)}>
      {routing.locales.map((option) => {
        const isCurrent = option === locale;

        return (
          <Button
            key={option}
            type="button"
            variant={isCurrent ? "secondary" : "ghost"}
            size="sm"
            lang={option}
            aria-label={LANGUAGES[option].name}
            aria-current={isCurrent ? "true" : undefined}
            disabled={isPending}
            onClick={() => switchLocale(option)}
            className={cn("px-2", !isCurrent && "text-muted-foreground")}
          >
            {LANGUAGES[option].short}
          </Button>
        );
      })}
    </div>
  );
};

export { LocaleSwitcher };
