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

/** Points de la manche pour chaque joueur (0 pour les perdants). */
export function scoreRound(outcome: Outcome, assignments: Record<string, Assignment>): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const [playerId, assignment] of Object.entries(assignments)) {
    scores[playerId] = outcome.winnerIds.includes(playerId)
      ? (SCORE_TABLE[outcome.winner][assignment.role] ?? 0)
      : 0;
  }
  return scores;
}
