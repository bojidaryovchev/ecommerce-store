import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Enable the new 'use cache' directive
  cacheComponents: true,

  // Transpile workspace packages
  transpilePackages: ["@ecommerce/database", "@ecommerce/mailbox", "@ecommerce/supplier-sync"],

  /*
   * Crawlers that get the title, description and canonical in the <head> rather than streamed into
   * the body: Next's own list plus Googlebot (which only trusts a canonical in the head) and the AI
   * search crawlers, which do not run JavaScript. Visitors keep streamed metadata.
   */
  htmlLimitedBots:
    /Googlebot|bingbot|GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-SearchBot|Claude-User|PerplexityBot|Perplexity-User|CCBot|Amazonbot|meta-externalagent|[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight/i,

  experimental: {
    // Mailbox replies carry attachments (up to 4 MB, see ATTACHMENT_LIMIT in @ecommerce/mailbox); Vercel caps
    // a request body at 4.5 MB anyway.
    serverActions: { bodySizeLimit: "4.5mb" },
  },

  /*
   * Nothing is indexed until launch: the product descriptions are still the supplier's own text. Every
   * response says noindex until SITE_INDEXING=on is set for the production build (see src/lib/indexing.ts,
   * which also turns the pages' robots meta and the robots.txt sitemap line on and off).
   */
  async headers() {
    if (process.env.SITE_INDEXING === "on") return [];
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },

  // The catalogue listings moved from English words to the site's language (Google: use words in the
  // audience's language). Old product and category URLs below them are redirected by the proxy, which
  // looks up their slugs (src/lib/route-index.ts).
  async redirects() {
    return ["", "/en"].flatMap((prefix) => [
      { source: `${prefix}/products`, destination: `${prefix}/produkti`, permanent: true },
      { source: `${prefix}/categories`, destination: `${prefix}/kategorii`, permanent: true },
    ]);
  },

  // Allow S3 images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      // Supplier product photos, until they are copied to our own storage.
      {
        protocol: "https",
        hostname: "hydrotermbg.com",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
