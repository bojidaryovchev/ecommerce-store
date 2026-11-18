import { SITE_INDEXABLE } from "@/lib/indexing";
import { SITE_URL } from "@/lib/site-url";
import type { MetadataRoute } from "next";

const PRIVATE_PATHS = ["/admin", "/api/", "/account", "/checkout", "/login"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...PRIVATE_PATHS, ...PRIVATE_PATHS.map((path) => `/en${path}`)],
      },
    ],
    // Until launch the pages say noindex (lib/indexing.ts): crawling stays allowed so that is seen, but
    // the sitemap is not advertised.
    ...(SITE_INDEXABLE && { sitemap: `${SITE_URL}/sitemap.xml` }),
  };
}
