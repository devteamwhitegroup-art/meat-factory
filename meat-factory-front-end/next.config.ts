import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow reaching the dev server over the LAN (tablet + other laptops).
  // Dev-only; `next start` ignores this. Add more hosts/IPs as needed.
  allowedDevOrigins: ["192.168.1.213"],
  // Byproduct pages merged under /byproduct — keep old bookmarks working.
  async redirects() {
    return [
      {
        source: "/byproduct-processing/:path*",
        destination: "/byproduct/:path*",
        permanent: false,
      },
      {
        source: "/byproduct-constants",
        destination: "/settings/byproduct",
        permanent: false,
      },
      // Export / domestic lists merged into /shipments (tabs). Exact paths
      // only — /shipments/<category>/new stays.
      {
        source: "/shipments/export",
        destination: "/shipments?tab=export",
        permanent: false,
      },
      {
        source: "/shipments/domestic",
        destination: "/shipments?tab=domestic",
        permanent: false,
      },
      // Admin setup pages moved under Систем тохиргоо.
      {
        source: "/byproduct/categories",
        destination: "/settings/byproduct",
        permanent: false,
      },
      {
        source: "/animals",
        destination: "/settings/animals",
        permanent: false,
      },
      {
        source: "/herder-addresses",
        destination: "/settings/herder-addresses",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
