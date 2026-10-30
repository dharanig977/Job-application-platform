import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Room for a resume upload through a server action.
    serverActions: { bodySizeLimit: "4.5mb" },
  },
};

export default nextConfig;
