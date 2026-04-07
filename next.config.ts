import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@initia/interwovenkit-react",
    "@initia/icons-react",
    "@initia/utils",
  ],
  // Allow accessing the dev server from your LAN IP in development
  allowedDevOrigins: ["192.168.1.9"],
};

export default nextConfig;
