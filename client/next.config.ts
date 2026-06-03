import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*?)",
        headers: [
          { key: "Link", value: '<https://queue-less-nu.vercel.app/manifest.webmanifest>; rel="manifest"' },
        ],
      },
    ];
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = "source-map";
    }
    return config;
  },
};

export default nextConfig;
