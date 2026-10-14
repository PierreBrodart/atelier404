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
  // ——— Build sur petite machine (VPS) ———————————————————————————————
  // Le build tourne sur le serveur de déploiement, pas sur une grosse machine de CI.
  // Ces deux réglages évitent que `next build` s'y fasse tuer par l'OOM killer.

  // Next collecte les pages et les prérend dans des workers, chacun chargeant toute l'app
  // (Three.js, R3F, GSAP, Leaflet). Par défaut il en ouvre `nombre de cœurs - 1` (11 sur
  // une machine de dev), ce qui multiplie d'autant la mémoire du build. Deux suffisent
  // largement pour 15 pages ; `NEXT_BUILD_CPUS` permet de remonter sur une grosse machine.
  experimental: {
    cpus: Number(process.env.NEXT_BUILD_CPUS) || 2,
  },
  // Source maps de la phase de prérendu : activées par défaut, utiles seulement pour
  // déboguer une erreur pendant `next build`. On s'en passe pour économiser la mémoire.
  enablePrerenderSourceMaps: false,
};

export default nextConfig;
