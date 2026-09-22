import type { NextConfig } from 'next';

// Sous-chemin de déploiement (ex. '/atelier404'). Doit être fourni au build :
// NEXT_PUBLIC_BASE_PATH=/atelier404 npm run build — vide par défaut (site à la racine).
// Même variable lue par src/lib/basePath.ts, une seule source de vérité.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  basePath,
  // Racine explicite : évite que Next remonte chercher un package-lock.json dans un dossier parent.
  turbopack: { root: process.cwd() },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // Filet de sécurité pour le build standalone (Docker) : le binaire natif de `sharp`
  // (utilisé par l'optimisation d'image de next/image en auto-hébergé) est parfois manqué
  // par le traçage automatique des fichiers — recommandation officielle de Next.js.
  outputFileTracingIncludes: {
    '/*': ['./node_modules/sharp/**/*'],
  },
};

export default nextConfig;
