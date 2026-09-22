import type { AccentName } from '@/data/types';
import { LIMITS } from './rules';
import type { AnswerOption, Kahoot, KahootSettings, MapPinQuestion, MultipleChoiceQuestion, Question, SliderQuestion, SourceInfo } from './types';

/**
 * Validation stricte d'un Kahoot reçu du réseau (données non fiables, jamais utilisées
 * telles quelles — même logique que `lib/undercover/parse.ts`). Retourne `null` dès qu'un
 * champ est invalide : rien n'est partiellement accepté.
 */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const text = (value: unknown, max: number, min = 0): string | null => {
  if (typeof value !== 'string') return null;
  const clean = value.replace(/\s+/g, ' ').trim().slice(0, max);
  return clean.length >= min ? clean : null;
};

/** Chaîne libre (peut contenir des retours à la ligne, ex. explication) mais bornée en longueur. */
const freeText = (value: unknown, max: number): string | null => {
  if (typeof value !== 'string') return null;
  return value.trim().slice(0, max);
};

const num = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);

const ACCENTS: AccentName[] = ['tomato', 'sun', 'blue', 'mint', 'pink', 'ink'];
const parseAccent = (value: unknown): AccentName | null =>
  typeof value === 'string' && (ACCENTS as string[]).includes(value) ? (value as AccentName) : null;

/**
 * N'accepte que des URL http(s) (utilisées telles quelles dans `src`/`href`, jamais
 * `javascript:`/`data:`…). `null` = champ absent (valide), `undefined` = valeur invalide (rejet).
 */
function parseUrl(value: unknown): string | null | undefined {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return undefined;
  const clean = value.trim().slice(0, LIMITS.urlMax);
  try {
    const url = new URL(clean);
    return url.protocol === 'http:' || url.protocol === 'https:' ? clean : undefined;
  } catch {
    return undefined;
  }
}

function parseSource(value: unknown): SourceInfo | null | undefined {
  if (value === null || value === undefined) return null;
  if (!isRecord(value)) return undefined;
  const name = text(value.name, LIMITS.sourceNameMax, 1);
  const url = parseUrl(value.url);
  if (name === null || !url) return undefined;
  return { name, url };
}

function parseId(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(value) ? value : fallback;
}

let counter = 0;
/** Identifiant court, lisible dans le DOM (drag & drop) — pas besoin d'UUID pour un sous-objet. */
export function shortId(): string {
  counter = (counter + 1) % 1_000_000;
  return `${Date.now().toString(36)}${counter.toString(36)}`;
}

interface CommonFields {
  id: string;
  question: string;
  timeLimit: number;
  points: number;
  explanation: string;
  source: SourceInfo | null;
  image: string | null;
}

/** Champs partagés par tous les types de question. `null` si un champ est invalide. */
function parseCommonFields(input: Record<string, unknown>): CommonFields | null {
  const question = text(input.question, LIMITS.questionTextMax, 1);
  const timeLimit = num(input.timeLimit);
  const points = num(input.points);
  if (question === null || timeLimit === null || points === null) return null;
  if (timeLimit < LIMITS.timeLimitMin || timeLimit > LIMITS.timeLimitMax) return null;
  if (points < LIMITS.pointsMin || points > LIMITS.pointsMax) return null;
  const explanation = freeText(input.explanation, LIMITS.explanationMax) ?? '';
  const source = parseSource(input.source);
  if (source === undefined) return null;
  const image = parseUrl(input.image);
  if (image === undefined) return null;

  return {
    id: parseId(input.id, shortId()),
    question,
    timeLimit: Math.round(timeLimit),
    points: Math.round(points),
    explanation,
    source,
    image,
  };
}

function parseMultipleChoice(input: Record<string, unknown>, common: CommonFields): MultipleChoiceQuestion | null {
  if (!Array.isArray(input.answers)) return null;
  const answers: AnswerOption[] = [];
  for (const raw of input.answers.slice(0, LIMITS.answersMax)) {
    if (!isRecord(raw)) return null;
    const answerText = text(raw.text, LIMITS.answerTextMax, 1);
    if (answerText === null) return null;
    answers.push({ id: parseId(raw.id, shortId()), text: answerText });
  }
  if (answers.length < LIMITS.answersMin) return null;

  const validIds = new Set(answers.map((answer) => answer.id));
  const correctInput = Array.isArray(input.correctAnswerIds) ? input.correctAnswerIds : [];
  const correctAnswerIds = [...new Set(correctInput.filter((id): id is string => typeof id === 'string' && validIds.has(id)))];
  if (correctAnswerIds.length === 0) return null;

  return { ...common, type: 'multiple_choice', answers, correctAnswerIds };
}

function parseSlider(input: Record<string, unknown>, common: CommonFields): SliderQuestion | null {
  const min = num(input.min);
  const max = num(input.max);
  const step = num(input.step);
  const correctValue = num(input.correctValue);
  if (min === null || max === null || step === null || correctValue === null) return null;
  if (max <= min || step <= 0 || max - min > LIMITS.sliderRangeMax) return null;
  if (correctValue < min || correctValue > max) return null;
  const unit = input.unit === null || input.unit === undefined ? null : text(input.unit, LIMITS.unitMax, 1);
  if (unit === undefined) return null;

  return { ...common, type: 'slider', min, max, step, correctValue, unit };
}

function parseMapPin(input: Record<string, unknown>, common: CommonFields): MapPinQuestion | null {
  const lat = num(input.lat);
  const lng = num(input.lng);
  const precisionKm = num(input.precisionKm);
  if (lat === null || lng === null || precisionKm === null) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180 || precisionKm <= 0) return null;
  let toleranceKm: number | null = null;
  if (input.toleranceKm !== null && input.toleranceKm !== undefined) {
    const value = num(input.toleranceKm);
    if (value === null || value <= 0) return null;
    toleranceKm = value;
  }

  return { ...common, type: 'map_pin', lat, lng, precisionKm, toleranceKm };
}

export function parseQuestion(input: unknown): Question | null {
  if (!isRecord(input)) return null;
  const common = parseCommonFields(input);
  if (!common) return null;
  switch (input.type) {
    case 'multiple_choice':
      return parseMultipleChoice(input, common);
    case 'slider':
      return parseSlider(input, common);
    case 'map_pin':
      return parseMapPin(input, common);
    default:
      return null;
  }
}

function parseSettings(input: unknown): KahootSettings | null {
  if (!isRecord(input)) return null;
  const accent = parseAccent(input.accent);
  if (!accent) return null;
  const backgroundImage = parseUrl(input.backgroundImage);
  if (backgroundImage === undefined) return null;
  return { accent, backgroundImage };
}

export interface KahootDraft {
  title: string;
  description: string;
  settings: KahootSettings;
  questions: Question[];
}

/** Valide le corps d'une requête de création/mise à jour. `null` = requête rejetée. */
export function parseKahootDraft(input: unknown): KahootDraft | null {
  if (!isRecord(input)) return null;
  const title = text(input.title, LIMITS.titleMax, LIMITS.titleMin);
  if (title === null) return null;
  const description = freeText(input.description, LIMITS.descriptionMax) ?? '';
  const settings = parseSettings(input.settings);
  if (!settings) return null;
  if (!Array.isArray(input.questions)) return null;
  if (input.questions.length < LIMITS.questionsMin || input.questions.length > LIMITS.questionsMax) return null;

  const questions: Question[] = [];
  for (const raw of input.questions) {
    const question = parseQuestion(raw);
    if (!question) return null;
    questions.push(question);
  }

  return { title, description, settings, questions };
}

export function isValidKahootId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{1,64}$/.test(id);
}

/** Type guard superficiel utilisé quand on relit un fichier JSON déjà écrit par nos soins. */
export function isKahoot(value: unknown): value is Kahoot {
  return isRecord(value) && typeof value.id === 'string' && typeof value.title === 'string' && Array.isArray(value.questions);
}
