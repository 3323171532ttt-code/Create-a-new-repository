import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  webpack: (config, { dev }) => {
    if (dev) {
      // Use in-memory cache in development to prevent macOS pack file rename ENOENT corruption
      config.cache = {
        type: "memory",
      };
    }
    return config;
  },
};

export default nextConfig;
