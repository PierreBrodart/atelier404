import type { MetadataRoute } from 'next';
import { projects } from '@/data/projects';
import { navigation, siteConfig } from '@/data/site';
import { BASE_PATH } from '@/lib/basePath';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  // Ni la room Undercover en cours ni un Kahoot précis (contenu dynamique, sans valeur SEO
  // individuelle) : seules les pages d'entrée sont listées, comme /undercover.
  const pages = ['', ...navigation.map((item) => item.href), '/undercover', '/kahoot'];

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
