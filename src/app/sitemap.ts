import type { MetadataRoute } from 'next';
import { projects } from '@/data/projects';
import { navigation, siteConfig } from '@/data/site';
import { BASE_PATH } from '@/lib/basePath';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = ['', ...navigation.map((item) => item.href), '/undercover'];

  return [
    ...pages.map((path) => ({
      url: `${siteConfig.url}${BASE_PATH}${path}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: path === '' ? 1 : 0.8,
    })),
    ...projects.map((project) => ({
      url: `${siteConfig.url}${BASE_PATH}/projets/${project.slug}`,
      lastModified: now,
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    })),
  ];
}
