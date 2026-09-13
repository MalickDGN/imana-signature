import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const routes = ['', '/collections', '/categories', '/about', '/contact', '/blog'];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/collections' ? 'daily' : 'monthly',
    priority: route === '' ? 1 : 0.7,
  }));
}
