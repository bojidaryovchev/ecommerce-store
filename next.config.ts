import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pinref-uploads-*.s3.amazonaws.com",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
        pathname: "/uploads/**",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Add support for WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Ensure WASM files are copied to the output
    if (isServer) {
      config.output.webassemblyModuleFilename = "chunks/[id].wasm";
    }

    return config;
  },
};

export default nextConfig;
