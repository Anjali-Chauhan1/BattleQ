import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@initia/interwovenkit-react",
    "@initia/icons-react",
    "@initia/utils"
  ]
};

export default nextConfig;
