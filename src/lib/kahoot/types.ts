/**
 * Types du module Kahoot (quiz manuel).
 *
 * Un Kahoot est entièrement décrit par un seul objet JSON (voir `store.ts` pour la
 * persistance sur disque). Pas de séparation public/privé comme Undercover : ce module
 * n'a pas encore d'adversaire réseau (mode local, un seul joueur sur son appareil), donc
 * les bonnes réponses peuvent être envoyées au client qui joue. Les fonctions de score
 * (`scoring.ts`) restent pures et pourront être rejouées côté serveur plus tard, quand le
 * mode multijoueur (préparé mais pas implémenté) en aura besoin.
 */

import type { AccentName } from '@/data/types';

export type QuestionType = 'multiple_choice' | 'slider' | 'map_pin';

export interface SourceInfo {
  name: string;
  url: string;
}

interface QuestionCommon {
  id: string;
  question: string;
  /** Secondes, 5 à 60. */
  timeLimit: number;
  points: number;
  explanation: string;
  source: SourceInfo | null;
  /** URL externe uniquement : pas d'upload. */
  image: string | null;
}

export interface AnswerOption {
  id: string;
  text: string;
}

export interface MultipleChoiceQuestion extends QuestionCommon {
  type: 'multiple_choice';
  answers: AnswerOption[];
  /** Une ou plusieurs bonnes réponses (ids de `answers`). */
  correctAnswerIds: string[];
}

export interface SliderQuestion extends QuestionCommon {
  type: 'slider';
  min: number;
  max: number;
  step: number;
  correctValue: number;
  unit: string | null;
}

export interface MapPinQuestion extends QuestionCommon {
  type: 'map_pin';
  lat: number;
  lng: number;
  /** Rayon (km) à l'intérieur duquel le score est maximal. */
  precisionKm: number;
  /** Rayon (km) au-delà duquel le score est nul. `null` = pas de coupure stricte. */
  toleranceKm: number | null;
}

export type Question = MultipleChoiceQuestion | SliderQuestion | MapPinQuestion;

export interface KahootSettings {
  accent: AccentName;
  backgroundImage: string | null;
}

export type KahootKind = 'manual' | 'auto';

export interface Kahoot {
  id: string;
  title: string;
  description: string;
  /** Toujours 'manual' pour l'instant : la génération automatique ('auto') arrive plus tard. */
  type: KahootKind;
  createdAt: string;
  updatedAt: string;
  settings: KahootSettings;
  questions: Question[];
}

/** Résumé léger utilisé par les listes (pas besoin des questions complètes). */
export interface KahootSummary {
  id: string;
  title: string;
  description: string;
  type: KahootKind;
  createdAt: string;
  updatedAt: string;
  accent: AccentName;
  questionCount: number;
}

export function toSummary(kahoot: Kahoot): KahootSummary {
  return {
    id: kahoot.id,
    title: kahoot.title,
    description: kahoot.description,
    type: kahoot.type,
    createdAt: kahoot.createdAt,
    updatedAt: kahoot.updatedAt,
    accent: kahoot.settings.accent,
    questionCount: kahoot.questions.length,
  };
}

// ——— Jeu (résultats locaux, un seul joueur) ————————————————————————————

export interface QuestionResult {
  questionId: string;
  score: number;
  /** true si la réponse est jugée correcte (utile pour l'affichage, indépendant du score continu) */
  correct: boolean;
  timedOut: boolean;
}

export interface PlaySummary {
  kahootId: string;
  totalScore: number;
  maxScore: number;
  results: QuestionResult[];
}
