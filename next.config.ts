import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Canonicalize www → apex so sessions don't split between subdomains.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.wallety.qzz.io",
          },
        ],
        destination: "https://wallety.qzz.io/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
