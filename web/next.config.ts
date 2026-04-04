import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(process.cwd(), ".."),
  turbopack: {},
  webpack: (config) => {
    // Prevent webpack from watching the parent deals/output directories
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        "**/node_modules/**",
        "**/deals/**",
        "**/output/**",
        "**/.git/**",
      ],
    };
    return config;
  },
};

export default nextConfig;
