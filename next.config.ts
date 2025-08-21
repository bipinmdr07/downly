import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: 'build',
  output: 'standalone',
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
