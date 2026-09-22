import { timingSafeEqual } from 'node:crypto';

/**
 * Segment secret de l'URL de l'éditeur Kahoot (`/kahoot/<ce-segment>`).
 *
 * Volontairement une variable d'environnement SANS préfixe `NEXT_PUBLIC_` : elle ne doit
 * jamais atterrir dans un bundle JavaScript envoyé au navigateur (sinon n'importe qui
 * pourrait la lire dans les DevTools), donc elle n'est lue que côté serveur (Server
 * Components, routes API) — jamais importée depuis un fichier `'use client'`.
 *
 * Ce n'est pas une authentification : juste une URL non devinable, comme demandé. Le dépôt
 * étant public, la valeur par défaut ci-dessous ne doit servir qu'en développement local :
 * en production, définissez `KAHOOT_EDITOR_SLUG` dans l'environnement du conteneur (jamais
 * commité) — voir TECHNICAL.md.
 */
export const KAHOOT_EDITOR_SLUG = process.env.KAHOOT_EDITOR_SLUG ?? 'atelier-prive-9f3k2q';

/**
 * Vérifie la clé envoyée par le client de l'éditeur (en-tête `x-kahoot-key`) avant toute
 * mutation (création / modification / suppression). Comparaison en temps constant, comme
 * `lib/undercover/store.ts`, pour ne pas laisser fuir d'information par le temps de réponse.
 */
export function isValidEditorKey(candidate: string | null): boolean {
  if (!candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(KAHOOT_EDITOR_SLUG);
  return a.length === b.length && timingSafeEqual(a, b);
}
