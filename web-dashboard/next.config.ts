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
        const BASE = 'https://vultacore.techprogression.com';
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
                  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co https://cdn.paddle.com https://sandbox-cdn.paddle.com https://pay.google.com https://www.gstatic.com",
                  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                  "font-src 'self' https://fonts.gstatic.com data:",
                  "img-src 'self' data: blob: https: https://checkout.paddle.com",
                  "connect-src 'self' https: wss: ws: https://api.paddle.com https://sandbox-api.paddle.com",
                  "frame-src 'self' https://checkout.paddle.com https://sandbox-checkout.paddle.com https://buy.paddle.com https://pay.google.com",
                ].join('; '),
              },
            ],
          },
          // RFC 8288 Link header on the homepage — advertises llms.txt and Markdown alternate to agents
          {
            source: '/',
            headers: [
              {
                key: 'Link',
                value: [
                  `<${BASE}/llms.txt>; rel="alternate"; type="text/plain"; title="llms.txt"`,
                  `<${BASE}/.well-known/mcp/server-card.json>; rel="mcp-server-card"`,
                  `<${BASE}/api/markdown>; rel="alternate"; type="text/markdown"; title="Markdown"`,
                  `<${BASE}/sitemap.xml>; rel="sitemap"; type="application/xml"`,
                ].join(', '),
              },
              // Content-Signal: declare how content may be used
              { key: 'X-Content-Signal', value: 'search=yes, ai-train=no, ai-inference=yes' },
            ],
          },
        ];
      },
      async rewrites() {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
        return [
          // Markdown alternate — serve /api/markdown when ?format=md or Accept: text/markdown
          {
            source: '/',
            has: [{ type: 'query', key: 'format', value: 'md' }],
            destination: '/api/markdown',
          },
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