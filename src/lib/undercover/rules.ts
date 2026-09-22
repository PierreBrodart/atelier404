import type { GameSettings, Role } from './types';

/** Constantes de règles et de robustesse (faciles à ajuster). */
export const LIMITS = {
  minPlayers: 3,
  maxPlayers: 10,
  nameMin: 2,
  nameMax: 16,
  clueMax: 40,
  guessMax: 40,
  /** Nombre maximum de re-votes successifs avant d'abandonner l'élimination du tour */
  maxVoteRounds: 3,
  /** Tours consécutifs sans élimination avant que les imposteurs gagnent */
  maxStalledTurns: 3,
} as const;

export const TIMING = {
  /** Un joueur déconnecté depuis ce délai ne bloque plus la partie */
  awayAfterMs: 30_000,
  /** Délai avant de transférer le rôle de host si le host est déconnecté */
  hostTransferAfterMs: 15_000,
  /** En lobby, un joueur déconnecté depuis ce délai est retiré */
  lobbyDropAfterMs: 30_000,
  /** Une room sans aucun joueur connecté est supprimée après ce délai */
  emptyRoomTtlMs: 10 * 60_000,
  /** Durée de vie maximale d'une room */
  roomTtlMs: 8 * 3_600_000,
} as const;

export interface Composition {
  civil: number;
  undercover: number;
  mrWhite: number;
  valid: boolean;
}

/**
 * Une composition est cohérente si :
 *  - il y a au moins un imposteur (Undercover ou Mr White) ;
 *  - il reste au moins 2 civils ;
 *  - les civils sont strictement plus nombreux que les imposteurs.
 */
export function composition(players: number, undercover: number, mrWhite: number): Composition {
  const civil = players - undercover - mrWhite;
  const valid =
    undercover >= 0 && mrWhite >= 0 && undercover + mrWhite >= 1 && civil >= 2 && civil > undercover + mrWhite;
  return { civil, undercover, mrWhite, valid };
}

/**
 * Il y a toujours exactement 1 Undercover. Mr White est optionnel (0 ou 1) et peut
 * coexister avec l'Undercover : c'est une bascule, pas un compteur.
 */
export const UNDERCOVER_COUNT = 1;

/** Vrai si la table est assez grande pour ajouter Mr White en plus de l'Undercover. */
export function mrWhiteAvailable(players: number): boolean {
  return composition(Math.max(players, LIMITS.minPlayers), UNDERCOVER_COUNT, 1).valid;
}

/** Ramène les réglages à une composition valide pour `players` joueurs. */
export function normalizeComposition(
  mrWhiteWanted: boolean,
  players: number,
): Pick<GameSettings, 'undercoverCount' | 'mrWhiteCount'> {
  const count = Math.max(players, LIMITS.minPlayers);
  // Si la table est trop petite pour Mr White, on le désactive tout seul.
  const mrWhiteCount = mrWhiteWanted && composition(count, UNDERCOVER_COUNT, 1).valid ? 1 : 0;
  return { undercoverCount: UNDERCOVER_COUNT, mrWhiteCount };
}

/** Normalise un mot pour la comparaison (casse, accents, ponctuation, espaces). */
export function normalizeWord(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/** Cible de vote réservée : « passer », jamais un id de joueur (générés via `newId`). */
export const SKIP_VOTE = 'skip';

export const ROLE_LABELS: Record<Role, string> = {
  CIVIL: 'Civil',
  UNDERCOVER: 'Undercover',
  MR_WHITE: 'Mr White',
};
