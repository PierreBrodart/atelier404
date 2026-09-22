import { LIMITS } from './rules';
import type { ClientAction, GameSettings } from './types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const text = (value: unknown, max: number): string | null =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : null;

/** Nettoie un nom de joueur (null si invalide). */
export function parseName(value: unknown): string | null {
  const name = text(value, LIMITS.nameMax);
  return name && name.length >= LIMITS.nameMin ? name : null;
}

/** Normalise un code de room saisi par l'utilisateur. */
export function parseCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const code = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return code.length === 5 ? code : null;
}

/**
 * Valide une action reçue du réseau (données non fiables).
 * Retourne null si la forme est invalide : rien n'est jamais utilisé tel quel.
 */
export function parseAction(input: unknown): ClientAction | null {
  if (!isRecord(input) || typeof input.type !== 'string') return null;

  switch (input.type) {
    case 'startGame':
    case 'ready':
    case 'next':
    case 'force':
    case 'newRound':
    case 'leave':
      return { type: input.type };

    case 'submitClue': {
      const clue = input.text === undefined ? '' : text(input.text, LIMITS.clueMax);
      return clue === null ? null : { type: 'submitClue', text: clue };
    }

    case 'vote':
      return typeof input.targetId === 'string' ? { type: 'vote', targetId: input.targetId.slice(0, 40) } : null;

    case 'guess': {
      const word = text(input.word, LIMITS.guessMax);
      return word ? { type: 'guess', word } : null;
    }

    case 'updateSettings': {
      if (!isRecord(input.settings)) return null;
      const settings: Partial<GameSettings> = {};
      // Le nombre d'Undercover n'est plus configurable : il y en a toujours exactement 1.
      const { themeId, mrWhiteCount, revealRoles } = input.settings;
      if (themeId !== undefined) {
        if (typeof themeId !== 'string') return null;
        settings.themeId = themeId.slice(0, 40);
      }
      if (mrWhiteCount !== undefined) {
        if (typeof mrWhiteCount !== 'number' || !Number.isFinite(mrWhiteCount)) return null;
        settings.mrWhiteCount = mrWhiteCount;
      }
      if (revealRoles !== undefined) {
        if (typeof revealRoles !== 'boolean') return null;
        settings.revealRoles = revealRoles;
      }
      return { type: 'updateSettings', settings };
    }

    default:
      return null;
  }
}
