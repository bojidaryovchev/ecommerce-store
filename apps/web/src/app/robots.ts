import { SITE_INDEXABLE } from "@/lib/indexing";
import { SITE_URL } from "@/lib/site-url";
import type { MetadataRoute } from "next";

/* Sign-in and account pages are not blocked: blocked, Google couldn't see that /login says noindex
   (and /account redirects there), and their linked URLs could be listed without content. */
const PRIVATE_PATHS = ["/admin", "/api/", "/checkout"];

/* Internal search, sorting and filters: endless combinations of one listing, kept out of the crawl.
   Page numbers stay crawlable (each page is its own canonical page), and so do brand links. */
const QUERY_TRAPS = ["/*?*q=", "/*?*sort=", "/*?*minPrice=", "/*?*maxPrice=", "/*?*inStock=", "/*?*f.", "/*?*r."];

/* Until launch, product photos stay out of image search too. They are served by Vercel's image
   optimiser, which the X-Robots-Tag header in next.config.ts does not reach, and robots.txt is how
   Google says to keep images out. */
const PRE_LAUNCH_PATHS = SITE_INDEXABLE ? [] : ["/_next/image"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...PRIVATE_PATHS, ...PRIVATE_PATHS.map((path) => `/en${path}`), ...QUERY_TRAPS, ...PRE_LAUNCH_PATHS],
      },
    ],
    // Until launch the pages say noindex (lib/indexing.ts): crawling stays allowed so that is seen, but
    // the sitemap is not advertised.
    ...(SITE_INDEXABLE && { sitemap: `${SITE_URL}/sitemap.xml` }),
  };
}
