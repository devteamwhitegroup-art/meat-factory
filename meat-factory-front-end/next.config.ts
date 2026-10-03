import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow reaching the dev server over the LAN (tablet + other laptops).
  // Dev-only; `next start` ignores this. Add more hosts/IPs as needed.
  allowedDevOrigins: ["192.168.1.213"],
};

export default nextConfig;
