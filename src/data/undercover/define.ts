import type { Theme } from '@/lib/undercover/types';

/**
 * Déclare un thème à partir de paires `[mot civil, mot undercover]`.
 * Pour ajouter un thème : créer un fichier qui appelle `defineTheme`, puis l'ajouter dans `index.ts`.
 * Les deux mots d'une paire doivent être proches, mais distincts.
 */
export function defineTheme(id: string, label: string, icon: string, pairs: [string, string][]): Theme {
  return {
    id,
    label,
    icon,
    pairs: pairs.map(([civilian, undercover]) => ({ civilian, undercover, theme: label })),
  };
}
