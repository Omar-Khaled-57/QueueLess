import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  webpack: (config, { dev }) => {
    if (dev) {
      // Avoid 'eval' in development to comply with strict CSP rules
      config.devtool = 'source-map';
    }
    return config;
  },
};

export default nextConfig;
