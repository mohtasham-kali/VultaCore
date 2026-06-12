import type { NextConfig } from "next";

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  // Cache all static files for offline fallback
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  // 'export' generates a static /out folder — required for Tauri to load CSS/JS locally
  output: process.env.STATIC_EXPORT ? 'export' : 'standalone',
  // Tauri serves files from disk, trailing slashes ensure index.html routing works
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
};

export default withPWA(nextConfig);
