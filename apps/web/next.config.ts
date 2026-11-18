import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Enable the new 'use cache' directive
  cacheComponents: true,

  // Transpile workspace packages
  transpilePackages: ["@ecommerce/database", "@ecommerce/mailbox", "@ecommerce/supplier-sync"],

  experimental: {
    // Mailbox replies carry attachments (up to 4 MB, see ATTACHMENT_LIMIT in @ecommerce/mailbox); Vercel caps
    // a request body at 4.5 MB anyway.
    serverActions: { bodySizeLimit: "4.5mb" },
  },

  /*
   * Until launch the site is public (on its own domain, taking Stripe test payments) but must not be
   * indexed: every response says noindex until SITE_INDEXING=on is set for the production build.
   * robots.txt still allows crawling, so search engines can see the noindex.
   */
  async headers() {
    if (process.env.SITE_INDEXING === "on") return [];
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
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
