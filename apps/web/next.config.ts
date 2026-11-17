import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Enable the new 'use cache' directive
  cacheComponents: true,

  // Transpile workspace packages
  transpilePackages: ["@ecommerce/database", "@ecommerce/supplier-sync"],

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
