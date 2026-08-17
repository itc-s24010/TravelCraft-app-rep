import type { NextConfig } from "next";

// SPRING_API_URL: base URL of the Spring Boot API (no trailing slash)
// - Local / Replit: leave unset → falls back to http://localhost:8099
// - Vercel production: set to the deployed Spring Boot URL, e.g.
//   https://your-app.railway.app
const springApiBase =
  process.env.SPRING_API_URL ||
  `http://localhost:${process.env.SPRING_API_PORT || 8099}`;

const nextConfig: NextConfig = {
  // Replit preview proxy forwards the full /travel-next prefix to Next.js,
  // so basePath must match. Vercel serves from root, so leave NEXT_PUBLIC_BASE_PATH unset there.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",

  // Allow Replit's proxied preview domains so JS/CSS assets load correctly
  allowedDevOrigins: ["*.replit.dev", "*.pike.replit.dev", "*.repl.co", "127.0.0.1"],

  async rewrites() {
    return [
      {
        // Use /spring/* prefix to avoid conflict with artifacts/api-server
        // which intercepts /api/* at the Replit proxy level before Next.js rewrites
        source: "/spring/:path*",
        destination: `${springApiBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
