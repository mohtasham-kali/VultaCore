import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/VultaCore',
  assetPrefix: '/VultaCore',
  images: {
    unoptimized: true,
  },
};


export default nextConfig;
