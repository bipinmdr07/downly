import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: 'build',
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path',
        destination: '/api/:path*'
      }
    ]
  }
};

export default nextConfig;
