import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Package photos uploaded in the ERP live on DigitalOcean Spaces.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.digitaloceanspaces.com" }],
  },
};

export default nextConfig;
