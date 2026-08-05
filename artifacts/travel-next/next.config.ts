import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Replit's proxied preview domains so JS/CSS assets load correctly
  allowedDevOrigins: ["*.replit.dev", "*.pike.replit.dev", "*.repl.co"],

  async rewrites() {
    return [
      {
        // Use /spring/* prefix to avoid conflict with artifacts/api-server
        // which intercepts /api/* at the Replit proxy level before Next.js rewrites
        source: "/spring/:path*",
        destination: `http://localhost:${process.env.SPRING_API_PORT || 8099}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
