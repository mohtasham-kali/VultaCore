import type { NextConfig } from "next";


import path from "path";

const nextConfig: NextConfig = {
  // 'export' generates a static /out folder — required for Tauri to load CSS/JS locally
  output: process.env.STATIC_EXPORT ? 'export' : 'standalone',
  outputFileTracingRoot: path.join(__dirname, "../"),
  // Tauri serves files from disk, trailing slashes ensure index.html routing works
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
