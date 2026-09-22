/** Constantes de règles et de robustesse (mêmes limites côté client et côté serveur). */
export const LIMITS = {
  titleMin: 2,
  titleMax: 80,
  descriptionMax: 300,
  questionTextMax: 220,
  questionsMin: 1,
  questionsMax: 50,
  answersMin: 2,
  answersMax: 6,
  answerTextMax: 80,
  timeLimitMin: 5,
  timeLimitMax: 60,
  pointsMin: 0,
  pointsMax: 2000,
  explanationMax: 400,
  sourceNameMax: 80,
  urlMax: 600,
  unitMax: 16,
  sliderRangeMax: 1_000_000,
} as const;

export const DEFAULT_TIME_LIMIT = 20;
export const DEFAULT_POINTS = 1000;

export const QUESTION_TYPE_LABELS: Record<'multiple_choice' | 'slider' | 'map_pin', string> = {
  multiple_choice: 'QCM',
  slider: 'Curseur',
  map_pin: 'Carte',
};
