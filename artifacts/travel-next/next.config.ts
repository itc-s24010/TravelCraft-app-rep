import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `http://localhost:${process.env.SPRING_API_PORT || 8099}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
