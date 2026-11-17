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
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
