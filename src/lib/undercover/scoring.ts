import type { Assignment, Outcome, Role, Winner } from './types';

/**
 * Barème des scores : points gagnés par rôle, selon l'équipe victorieuse.
 * Pour changer les règles de score, il suffit de modifier ce tableau
 * (ou de remplacer `scoreRound` par une autre fonction de même signature).
 */
export const SCORE_TABLE: Record<Winner, Partial<Record<Role, number>>> = {
  CIVILS: { CIVIL: 2 },
  UNDERCOVER: { UNDERCOVER: 10, MR_WHITE: 6 },
  MR_WHITE: { MR_WHITE: 6 },
};

/** Part des points d'un joueur du camp gagnant éliminé en cours de manche (les survivants ont le plein tarif). */
export const ELIMINATED_SHARE = 0.5;

/**
 * Points de la manche pour chaque joueur (0 pour les perdants). Tout le camp gagnant marque ; un gagnant
 * éliminé en cours de route n'a que `ELIMINATED_SHARE` des points — sauf Mr White qui gagne en devinant
 * le mot : il vient d'être éliminé, mais la victoire est la sienne.
 */
export function scoreRound(
  outcome: Outcome,
  assignments: Record<string, Assignment>,
  alive: readonly string[],
): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const [playerId, assignment] of Object.entries(assignments)) {
    const points = outcome.winnerIds.includes(playerId) ? (SCORE_TABLE[outcome.winner][assignment.role] ?? 0) : 0;
    const survived = alive.includes(playerId) || outcome.byGuess;
    scores[playerId] = survived ? points : Math.round(points * ELIMINATED_SHARE);
  }
  return scores;
}
