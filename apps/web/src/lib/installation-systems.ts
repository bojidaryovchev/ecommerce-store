/**
 * The installations we sell as a service, each with its own page under /montazh: what it is, how it
 * is installed (an illustrated, scroll-driven story), what is included, and the request form.
 * Only systems that are expensive, need a professional and are hard to picture get one; the rest of
 * the catalog sells from its product pages (see the storefront plan).
 *
 * Texts live in messages/<locale>/installation.json under systems.<slug>.
 */
export const INSTALLATION_SYSTEMS = [
  { slug: "termopompa", image: "/images/categories/termopompi.webp", categorySlug: "termopompi" },
  { slug: "peletno-otoplenie", image: "/images/categories/peletni-kamini.webp", categorySlug: "peletni-kamini" },
  { slug: "klimatik", image: "/images/categories/klimatitsi.webp", categorySlug: "klimatitsi" },
  { slug: "podovo-otoplenie", image: "/images/categories/podovo-otoplenie.webp", categorySlug: "podovo-otoplenie" },
] as const;

export type InstallationSystem = (typeof INSTALLATION_SYSTEMS)[number];
export type InstallationSystemSlug = InstallationSystem["slug"];

export const isInstallationSystem = (slug: string): slug is InstallationSystemSlug =>
  INSTALLATION_SYSTEMS.some((system) => system.slug === slug);

export const installationHref = (slug?: InstallationSystemSlug) => (slug ? `/montazh/${slug}` : "/montazh");

/** The installation page a product category leads to, for the products menu and category pages. */
export const INSTALLATION_FOR_CATEGORY: Readonly<Record<string, InstallationSystemSlug>> = {
  termopompi: "termopompa",
  "peletni-kamini": "peletno-otoplenie",
  kotli: "peletno-otoplenie",
  "radiatori-i-konvektori": "peletno-otoplenie",
  klimatitsi: "klimatik",
  "podovo-otoplenie": "podovo-otoplenie",
};
