import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "az-cdn.selise.biz",
        pathname: "/selisecdn/cdn/signature/**",
      },
    ],
  },
};

export default nextConfig;
