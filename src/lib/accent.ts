import type { AccentName } from '@/data/types';

/** Variable CSS de la couleur d'accent. */
export const accentVar = (accent: AccentName) => `var(--${accent})`;

/** Couleur de texte lisible (contraste AA) posée sur un accent. */
export const onAccentVar = (accent: AccentName) =>
  accent === 'blue' || accent === 'ink' ? 'var(--paper)' : 'var(--ink)';

/** Valeurs hex des accents (pour la 3D). Doivent rester synchronisées avec `styles/base/_tokens.scss`. */
export const accentHex: Record<AccentName, string> = {
  tomato: '#FF4A2E',
  sun: '#FFC61A',
  blue: '#2A47FF',
  mint: '#3ED8A0',
  pink: '#FF8AD1',
  ink: '#16133B',
};
