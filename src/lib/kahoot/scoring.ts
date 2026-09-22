import type { MapPinQuestion, MultipleChoiceQuestion, Question, SliderQuestion } from './types';

/**
 * Calcul du score. Fonctions pures (aucun accès au DOM ni au réseau) : utilisées en local
 * pour l'instant, mais conçues pour être rejouées telles quelles côté serveur le jour où le
 * mode multijoueur validera les réponses côté serveur plutôt que de faire confiance au client.
 */

/** 0.5 (temps écoulé) à 1 (réponse instantanée) : la rapidité ne fait jamais perdre plus de la moitié des points. */
function speedFactor(timeLeftMs: number, timeLimitMs: number): number {
  if (timeLimitMs <= 0) return 0.5;
  const ratio = Math.max(0, Math.min(1, timeLeftMs / timeLimitMs));
  return 0.5 + 0.5 * ratio;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export interface ScoreOutcome {
  score: number;
  correct: boolean;
}

export function scoreMultipleChoice(
  question: MultipleChoiceQuestion,
  selectedIds: string[],
  timeLeftMs: number,
  timeLimitMs: number,
): ScoreOutcome {
  const correctSet = new Set(question.correctAnswerIds);
  const selectedSet = new Set(selectedIds);
  const correct = correctSet.size === selectedSet.size && [...correctSet].every((id) => selectedSet.has(id));
  if (!correct) return { score: 0, correct: false };
  return { score: Math.round(question.points * speedFactor(timeLeftMs, timeLimitMs)), correct: true };
}

export function scoreSlider(question: SliderQuestion, value: number, timeLeftMs: number, timeLimitMs: number): ScoreOutcome {
  const range = Math.max(1e-6, question.max - question.min);
  const distance = Math.abs(value - question.correctValue);
  const accuracy = clamp01(1 - distance / range);
  const correct = value === question.correctValue;
  return { score: Math.round(question.points * accuracy * speedFactor(timeLeftMs, timeLimitMs)), correct };
}

/** Distance orthodromique (km) entre deux points géographiques. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function scoreMapPin(
  question: MapPinQuestion,
  lat: number,
  lng: number,
  timeLeftMs: number,
  timeLimitMs: number,
): ScoreOutcome {
  const distance = haversineKm(lat, lng, question.lat, question.lng);
  if (question.toleranceKm !== null && distance > question.toleranceKm) return { score: 0, correct: false };
  const precision = Math.max(1e-6, question.precisionKm);
  const accuracy = clamp01(1 - distance / precision);
  return { score: Math.round(question.points * accuracy * speedFactor(timeLeftMs, timeLimitMs)), correct: accuracy >= 0.999 };
}

export type Answer =
  | { type: 'multiple_choice'; selectedIds: string[] }
  | { type: 'slider'; value: number }
  | { type: 'map_pin'; lat: number; lng: number }
  | { type: 'none' };

/** Point d'entrée unique : dispatch selon le type de question. `answer.type` doit correspondre à `question.type`. */
export function scoreForQuestion(question: Question, answer: Answer, timeLeftMs: number): ScoreOutcome {
  const timeLimitMs = question.timeLimit * 1000;
  if (question.type === 'multiple_choice' && answer.type === 'multiple_choice') {
    return scoreMultipleChoice(question, answer.selectedIds, timeLeftMs, timeLimitMs);
  }
  if (question.type === 'slider' && answer.type === 'slider') {
    return scoreSlider(question, answer.value, timeLeftMs, timeLimitMs);
  }
  if (question.type === 'map_pin' && answer.type === 'map_pin') {
    return scoreMapPin(question, answer.lat, answer.lng, timeLeftMs, timeLimitMs);
  }
  return { score: 0, correct: false };
}
