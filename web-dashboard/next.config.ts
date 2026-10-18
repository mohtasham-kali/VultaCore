import type { NextConfig } from "next";

const isExport = process.env.STATIC_EXPORT === 'true';

const nextConfig: NextConfig = {
  // 'export' generates a static /out folder, required for Tauri to load CSS/JS locally
  output: isExport ? 'export' : 'standalone',
  // Tauri serves files from disk, trailing slashes ensure index.html routing works
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // Rewrites don't work with static export, so only define them for the server build
  ...(isExport
    ? {}
    : {
      async rewrites() {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
        return [
          {
            source: '/api/:path*',
            destination: `${backendUrl}/api/:path*`,
          },
          {
            source: '/socket.io/:path*',
            destination: `${backendUrl}/socket.io/:path*`,
          },
        ];
      },
    }),
};

export default nextConfig;