import { MetadataRoute } from 'next';

const BASE_URL = 'https://vultacore.techprogression.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/auth/callback', '/admin/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    // Content-Signal header added via server.js / next.config.ts response headers
  };
}
