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
  // Rewrites and security headers are active in server mode
  ...(isExport
    ? {}
    : {
      async headers() {
        return [
          {
            source: '/:path*',
            headers: [
              { key: 'X-Frame-Options', value: 'DENY' },
              { key: 'X-Content-Type-Options', value: 'nosniff' },
              { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
              { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
              { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
              {
                key: 'Content-Security-Policy',
                value: [
                  "default-src 'self'",
                  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co https://*.lemonsqueezy.com https://pay.google.com https://www.gstatic.com",
                  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                  "font-src 'self' https://fonts.gstatic.com data:",
                  "img-src 'self' data: blob: https:",
                  "connect-src 'self' https: wss: ws:",
                  "frame-src 'self' https://*.lemonsqueezy.com https://pay.google.com",
                ].join('; '),
              },
            ],
          },
        ];
      },
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