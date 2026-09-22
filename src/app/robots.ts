import type { MetadataRoute } from 'next';
import { siteConfig } from '@/data/site';
import { BASE_PATH } from '@/lib/basePath';

export default function robots(): MetadataRoute.Robots {
  return {
    // Les chemins d'un robots.txt sont relatifs à la racine du domaine, pas à `basePath` :
    // sous un sous-chemin (ex. /atelier404), il faut l'inclure explicitement ici.
    rules: { userAgent: '*', allow: `${BASE_PATH}/` },
    sitemap: `${siteConfig.url}${BASE_PATH}/sitemap.xml`,
  };
}
