import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow accessing the dev server from your LAN IP in development
  allowedDevOrigins: ["192.168.1.9"],

  // Transpile Initia packages so Turbopack can resolve their internals
  transpilePackages: [
    "@initia/interwovenkit-react",
    "@initia/icons-react",
  ],

  // Required for Next.js 16 Turbopack compatibility
  turbopack: {},
};

export default nextConfig;
