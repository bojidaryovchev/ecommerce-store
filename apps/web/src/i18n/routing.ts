import { defineRouting } from "next-intl/routing";

/**
 * Bulgarian is the default and lives at the root (/products); English is under /en (/en/products).
 * No automatic redirect from the browser language: many Bulgarian shoppers run English browsers.
 * Without detection the locale cookie would be written and never read, so it is off: the URL alone
 * says the language, and the cookie policy stays short.
 */
export const routing = defineRouting({
  locales: ["bg", "en"],
  defaultLocale: "bg",
  localePrefix: "as-needed",
  localeDetection: false,
  localeCookie: false,
  // hreflang comes from the pages (lib/seo.ts), only where the content exists in both languages; the
  // middleware's Link header would name English versions of Bulgarian-only pages and drop the query.
  alternateLinks: false,
});

export type Locale = (typeof routing.locales)[number];
