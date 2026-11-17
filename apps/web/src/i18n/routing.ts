import { defineRouting } from "next-intl/routing";

/**
 * Bulgarian is the default and lives at the root (/products); English is under /en (/en/products).
 * No automatic redirect from the browser language: many Bulgarian shoppers run English browsers.
 */
export const routing = defineRouting({
  locales: ["bg", "en"],
  defaultLocale: "bg",
  localePrefix: "as-needed",
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
