import type { NextConfig } from "next";

const apiBaseUrl = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiBaseUrl.replace(/\/$/, "")}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${apiBaseUrl.replace(/\/$/, "")}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
