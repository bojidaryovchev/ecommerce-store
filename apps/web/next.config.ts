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
   * Nothing is indexed until launch: the product descriptions are still the supplier's own text. Every
   * response says noindex until SITE_INDEXING=on is set for the production build (see src/lib/indexing.ts,
   * which also turns the pages' robots meta and the robots.txt sitemap line on and off).
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
