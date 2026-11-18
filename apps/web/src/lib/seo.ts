import type { Metadata } from "next";

/**
 * Canonical and hreflang links for a page whose content exists in both languages: each language is
 * its own canonical page, and they point at each other. Pages whose content is Bulgarian only
 * (products, categories) keep the Bulgarian URL as the canonical instead.
 */
export function localizedAlternates(path: string, locale: string): NonNullable<Metadata["alternates"]> {
  const english = `/en${path === "/" ? "" : path}`;
  return {
    canonical: locale === "en" ? english : path,
    languages: { bg: path, en: english, "x-default": path },
  };
}
