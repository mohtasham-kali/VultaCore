import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 'export' generates a static /out folder — required for Tauri to load CSS/JS locally
  output: 'export',
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
