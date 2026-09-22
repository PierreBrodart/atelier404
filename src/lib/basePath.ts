/**
 * Sous-chemin de déploiement (ex. `/atelier404` quand le site vit sous
 * `https://mon-domaine.fr/atelier404`). Vide par défaut (site à la racine).
 *
 * Doit être défini au build (`NEXT_PUBLIC_BASE_PATH=/atelier404 npm run build`) :
 * la valeur est figée dans les bundles côté client, comme `basePath` dans next.config.ts
 * (qui lit la même variable — une seule source de vérité).
 *
 * `next/link`, `next/image` et les fichiers de métadonnées de Next (favicon, sitemap,
 * robots…) appliquent automatiquement ce préfixe. Il faut le faire à la main partout où
 * une URL absolue est construite « en dur » : `fetch()`, `EventSource()`, et les URLs
 * publiées dans `sitemap.ts` / `robots.ts`.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
