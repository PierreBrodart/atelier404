import type { GameSettings, Role } from './types';

/** Constantes de règles et de robustesse (faciles à ajuster). */
export const LIMITS = {
  minPlayers: 3,
  maxPlayers: 10,
  /** Spectateurs en plus des joueurs (file d'attente comprise) */
  maxSpectators: 10,
  nameMin: 2,
  nameMax: 16,
  clueMax: 40,
  guessMax: 40,
  chatMax: 200,
  /** Messages de chat gardés par room */
  chatHistory: 80,
  /** Limitation de débit du chat : au plus `chatBurst` messages par fenêtre de `chatWindowMs` */
  chatBurst: 5,
  chatWindowMs: 5_000,
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
 * Nombre maximum d'imposteurs (Undercover + Mr White) pour `players` joueurs.
 * La table est comptée à au moins `minPlayers` : en lobby, on peut préparer la partie avant que tout le monde soit là.
 */
export function maxImpostors(players: number): number {
  const count = Math.max(players, LIMITS.minPlayers);
  let max = 0;
  while (composition(count, max + 1, 0).valid) max += 1;
  return max;
}

/**
 * Il y a toujours au moins 1 Undercover (le host en choisit le nombre). Mr White est optionnel (0 ou 1)
 * et s'ajoute aux Undercover : c'est une bascule, pas un compteur.
 *
 * Ramène les réglages à une composition valide pour `players` joueurs. Quand les deux ne tiennent pas
 * ensemble, `keep` désigne le réglage qui l'emporte (celui que le host vient de modifier) ; l'autre s'ajuste.
 */
export function normalizeComposition(
  undercoverWanted: number,
  mrWhiteWanted: boolean,
  players: number,
  keep: 'undercover' | 'mrWhite' = 'mrWhite',
): Pick<GameSettings, 'undercoverCount' | 'mrWhiteCount'> {
  const max = maxImpostors(players);
  const wanted = Number.isFinite(undercoverWanted) ? Math.round(undercoverWanted) : 1;
  const clamp = (value: number, limit: number) => Math.min(Math.max(value, 1), Math.max(limit, 1));

  if (keep === 'undercover') {
    const undercoverCount = clamp(wanted, max);
    return { undercoverCount, mrWhiteCount: mrWhiteWanted && undercoverCount + 1 <= max ? 1 : 0 };
  }
  // Mr White d'abord : il faut au moins 1 Undercover à côté de lui, sinon la table est trop petite.
  const mrWhiteCount = mrWhiteWanted && max >= 2 ? 1 : 0;
  return { undercoverCount: clamp(wanted, max - mrWhiteCount), mrWhiteCount };
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
