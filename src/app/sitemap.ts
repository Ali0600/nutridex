import type { MetadataRoute } from 'next';
import { getConditions, getItems, getOrgans } from '@/lib/content';
import { getBlogPosts } from '@/lib/blog';
import { NUTRIENTS } from '@/lib/nutrients-config';
import { CATEGORIES } from '@/lib/schema';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (p: string) => `${SITE_URL}${p}`;
  const staticRoutes = [
    '',
    '/items',
    '/compare',
    '/quiz',
    '/super-foods',
    '/super-fruits',
    '/blog',
    '/about',
  ].map(
    (p) => ({
    url: url(p || '/'),
    lastModified: new Date(),
  }));

  return [
    ...staticRoutes,
    ...CATEGORIES.map((c) => ({ url: url(`/categories/${c}`) })),
    ...getItems().map((i) => ({ url: url(`/items/${i.slug}`), lastModified: new Date(i.updatedAt) })),
    ...getOrgans().map((o) => ({ url: url(`/organs/${o.id}`) })),
    ...getConditions().map((c) => ({ url: url(`/goals/${c.id}`) })),
    ...NUTRIENTS.map((n) => ({ url: url(`/nutrients/${n.key}`) })),
    ...getBlogPosts().map((p) => ({ url: url(`/blog/${p.slug}`), lastModified: new Date(p.date) })),
  ];
}
