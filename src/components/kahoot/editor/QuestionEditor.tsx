'use client';

import dynamic from 'next/dynamic';
import type { ChangeEvent, DragEvent } from 'react';
import { LIMITS, QUESTION_TYPE_LABELS } from '@/lib/kahoot/rules';
import type { AnswerOption, MapPinQuestion, MultipleChoiceQuestion, Question, QuestionType, SliderQuestion } from '@/lib/kahoot/types';
import { shortId } from '@/lib/kahoot/validate';

const MapPicker = dynamic(() => import('../MapPicker'), { ssr: false, loading: () => <p className="kh-map-loading">Carte…</p> });

function emptyQuestion(type: QuestionType): Question {
  const common = {
    id: shortId(),
    question: '',
    timeLimit: 20,
    points: 1000,
    explanation: '',
    source: null,
    image: null,
  };
  switch (type) {
    case 'multiple_choice':
      return {
        ...common,
        type,
        answers: [
          { id: shortId(), text: '' },
          { id: shortId(), text: '' },
        ],
        correctAnswerIds: [],
      };
    case 'slider':
      return { ...common, type, min: 0, max: 100, step: 1, correctValue: 50, unit: null };
    case 'map_pin':
      return { ...common, type, lat: 48.8566, lng: 2.3522, precisionKm: 50, toleranceKm: null };
  }
}

export { emptyQuestion };

/** Change le type d'une question en conservant les champs communs (texte, temps, points…). */
export function changeQuestionType(question: Question, type: QuestionType): Question {
  const fresh = emptyQuestion(type);
  return {
    ...fresh,
    id: question.id,
    question: question.question,
    timeLimit: question.timeLimit,
    points: question.points,
    explanation: question.explanation,
    source: question.source,
    image: question.image,
  };
}

// ——— Champs communs ————————————————————————————————————————————

function CommonFields({ question, onChange }: { question: Question; onChange: (patch: Partial<Question>) => void }) {
  return (
    <div className="kh-qfields">
      <div className="field">
        <label htmlFor={`q-text-${question.id}`}>Question</label>
        <textarea
          id={`q-text-${question.id}`}
          value={question.question}
          maxLength={LIMITS.questionTextMax}
          onChange={(event) => onChange({ question: event.target.value })}
          rows={2}
        />
      </div>

      <div className="kh-qfields__row">
        <div className="field">
          <label htmlFor={`q-time-${question.id}`}>Temps limite (s)</label>
          <input
            id={`q-time-${question.id}`}
            type="number"
            min={LIMITS.timeLimitMin}
            max={LIMITS.timeLimitMax}
            value={question.timeLimit}
            onChange={(event) => onChange({ timeLimit: clampNum(event, LIMITS.timeLimitMin, LIMITS.timeLimitMax, question.timeLimit) })}
          />
        </div>
        <div className="field">
          <label htmlFor={`q-points-${question.id}`}>Points</label>
          <input
            id={`q-points-${question.id}`}
            type="number"
            min={LIMITS.pointsMin}
            max={LIMITS.pointsMax}
            step={50}
            value={question.points}
            onChange={(event) => onChange({ points: clampNum(event, LIMITS.pointsMin, LIMITS.pointsMax, question.points) })}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor={`q-image-${question.id}`}>Image (URL, facultatif)</label>
        <input
          id={`q-image-${question.id}`}
          type="url"
          inputMode="url"
          placeholder="https://…"
          value={question.image ?? ''}
          onChange={(event) => onChange({ image: event.target.value || null })}
        />
      </div>

      <div className="field">
        <label htmlFor={`q-explanation-${question.id}`}>Explication (affichée après la réponse)</label>
        <textarea
          id={`q-explanation-${question.id}`}
          value={question.explanation}
          maxLength={LIMITS.explanationMax}
          onChange={(event) => onChange({ explanation: event.target.value })}
          rows={2}
        />
      </div>

      <div className="kh-qfields__row">
        <div className="field">
          <label htmlFor={`q-source-name-${question.id}`}>Source (nom, facultatif)</label>
          <input
            id={`q-source-name-${question.id}`}
            type="text"
            maxLength={LIMITS.sourceNameMax}
            value={question.source?.name ?? ''}
            onChange={(event) => {
              const name = event.target.value;
              onChange({ source: name ? { name, url: question.source?.url ?? '' } : null });
            }}
          />
        </div>
        <div className="field">
          <label htmlFor={`q-source-url-${question.id}`}>Source (URL)</label>
          <input
            id={`q-source-url-${question.id}`}
            type="url"
            inputMode="url"
            placeholder="https://…"
            value={question.source?.url ?? ''}
            disabled={!question.source?.name}
            onChange={(event) => {
              if (!question.source) return;
              onChange({ source: { ...question.source, url: event.target.value } });
            }}
          />
        </div>
      </div>
    </div>
  );
}

function clampNum(event: ChangeEvent<HTMLInputElement>, min: number, max: number, fallback: number): number {
  const value = event.target.valueAsNumber;
  if (Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

// ——— QCM ——————————————————————————————————————————————————————

function MultipleChoiceFields({ question, onChange }: { question: MultipleChoiceQuestion; onChange: (patch: Partial<MultipleChoiceQuestion>) => void }) {
  const setAnswer = (id: string, text: string) => {
    onChange({ answers: question.answers.map((answer) => (answer.id === id ? { ...answer, text } : answer)) });
  };
  const toggleCorrect = (id: string, checked: boolean) => {
    const set = new Set(question.correctAnswerIds);
    if (checked) set.add(id);
    else set.delete(id);
    onChange({ correctAnswerIds: [...set] });
  };
  const addAnswer = () => {
    if (question.answers.length >= LIMITS.answersMax) return;
    const answer: AnswerOption = { id: shortId(), text: '' };
    onChange({ answers: [...question.answers, answer] });
  };
  const removeAnswer = (id: string) => {
    if (question.answers.length <= LIMITS.answersMin) return;
    onChange({
      answers: question.answers.filter((answer) => answer.id !== id),
      correctAnswerIds: question.correctAnswerIds.filter((cid) => cid !== id),
    });
  };

  return (
    <fieldset className="kh-answers">
      <legend>Propositions (coche la ou les bonnes réponses)</legend>
      {question.answers.map((answer, index) => (
        <div className="kh-answer" key={answer.id}>
          <label className="kh-answer__check">
            <input
              type="checkbox"
              checked={question.correctAnswerIds.includes(answer.id)}
              onChange={(event) => toggleCorrect(answer.id, event.target.checked)}
              aria-label={`Proposition ${index + 1} correcte`}
            />
          </label>
          <input
            type="text"
            className="kh-answer__text"
            value={answer.text}
            maxLength={LIMITS.answerTextMax}
            placeholder={`Proposition ${index + 1}`}
            onChange={(event) => setAnswer(answer.id, event.target.value)}
          />
          <button
            type="button"
            className="kh-link-button"
            onClick={() => removeAnswer(answer.id)}
            disabled={question.answers.length <= LIMITS.answersMin}
          >
            Retirer
          </button>
        </div>
      ))}
      {question.answers.length < LIMITS.answersMax && (
        <button type="button" className="kh-link-button" onClick={addAnswer}>
          + Ajouter une proposition
        </button>
      )}
    </fieldset>
  );
}

// ——— Curseur ——————————————————————————————————————————————————

function SliderFields({ question, onChange }: { question: SliderQuestion; onChange: (patch: Partial<SliderQuestion>) => void }) {
  return (
    <div className="kh-qfields__row kh-qfields__row--wrap">
      <div className="field">
        <label htmlFor={`q-min-${question.id}`}>Minimum</label>
        <input
          id={`q-min-${question.id}`}
          type="number"
          value={question.min}
          onChange={(event) => !Number.isNaN(event.target.valueAsNumber) && onChange({ min: event.target.valueAsNumber })}
        />
      </div>
      <div className="field">
        <label htmlFor={`q-max-${question.id}`}>Maximum</label>
        <input
          id={`q-max-${question.id}`}
          type="number"
          value={question.max}
          onChange={(event) => !Number.isNaN(event.target.valueAsNumber) && onChange({ max: event.target.valueAsNumber })}
        />
      </div>
      <div className="field">
        <label htmlFor={`q-step-${question.id}`}>Pas</label>
        <input
          id={`q-step-${question.id}`}
          type="number"
          min={0.001}
          value={question.step}
          onChange={(event) => !Number.isNaN(event.target.valueAsNumber) && event.target.valueAsNumber > 0 && onChange({ step: event.target.valueAsNumber })}
        />
      </div>
      <div className="field">
        <label htmlFor={`q-correct-${question.id}`}>Valeur correcte</label>
        <input
          id={`q-correct-${question.id}`}
          type="number"
          value={question.correctValue}
          onChange={(event) => !Number.isNaN(event.target.valueAsNumber) && onChange({ correctValue: event.target.valueAsNumber })}
        />
      </div>
      <div className="field">
        <label htmlFor={`q-unit-${question.id}`}>Unité (facultatif)</label>
        <input
          id={`q-unit-${question.id}`}
          type="text"
          maxLength={LIMITS.unitMax}
          placeholder="°C, km, ans…"
          value={question.unit ?? ''}
          onChange={(event) => onChange({ unit: event.target.value || null })}
        />
      </div>
    </div>
  );
}

// ——— Carte ————————————————————————————————————————————————————

function MapPinFields({ question, onChange }: { question: MapPinQuestion; onChange: (patch: Partial<MapPinQuestion>) => void }) {
  return (
    <div className="kh-mapfields">
      <p className="kh-hint">Touche la carte pour placer la bonne réponse.</p>
      <MapPicker value={{ lat: question.lat, lng: question.lng }} onPick={(lat, lng) => onChange({ lat, lng })} className="kh-map kh-map--edit" />
      <div className="kh-qfields__row">
        <div className="field">
          <label htmlFor={`q-precision-${question.id}`}>Précision attendue (km)</label>
          <input
            id={`q-precision-${question.id}`}
            type="number"
            min={1}
            value={question.precisionKm}
            onChange={(event) => event.target.valueAsNumber > 0 && onChange({ precisionKm: event.target.valueAsNumber })}
          />
          <p className="field__hint">Score maximal si le joueur pointe à moins de cette distance.</p>
        </div>
        <div className="field">
          <label htmlFor={`q-tolerance-${question.id}`}>Zone acceptable (km, facultatif)</label>
          <input
            id={`q-tolerance-${question.id}`}
            type="number"
            min={1}
            value={question.toleranceKm ?? ''}
            placeholder="Illimitée"
            onChange={(event) => {
              const value = event.target.value;
              onChange({ toleranceKm: value === '' ? null : Math.max(1, Number(value)) });
            }}
          />
          <p className="field__hint">Au-delà, le score de cette question tombe à zéro.</p>
        </div>
      </div>
    </div>
  );
}

// ——— Carte de question (liste) ————————————————————————————————————

export interface QuestionEditorProps {
  question: Question;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<Question>) => void;
  onChangeType: (type: QuestionType) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  dragHandleProps: {
    draggable: boolean;
    onDragStart: () => void;
    onDragOver: (event: DragEvent) => void;
    onDrop: () => void;
    onDragEnd: () => void;
  };
}

export function QuestionEditor({
  question,
  index,
  expanded,
  onToggle,
  onChange,
  onChangeType,
  onDuplicate,
  onRemove,
  onMove,
  canMoveUp,
  canMoveDown,
  dragHandleProps,
}: QuestionEditorProps) {
  return (
    <li className="kh-question" data-expanded={expanded} {...dragHandleProps}>
      <div className="kh-question__head">
        <button type="button" className="kh-question__handle" aria-label="Glisser pour réordonner" tabIndex={-1}>
          ⠿
        </button>
        <button type="button" className="kh-question__summary" onClick={onToggle} aria-expanded={expanded}>
          <span className="kh-question__index">{index + 1}</span>
          <span className="kh-question__title">{question.question.trim() || 'Question sans titre'}</span>
          <span className="kh-tag">{QUESTION_TYPE_LABELS[question.type]}</span>
        </button>
        <div className="kh-question__actions">
          <button type="button" className="kh-link-button" onClick={() => onMove(-1)} disabled={!canMoveUp} aria-label="Monter la question">
            ↑
          </button>
          <button type="button" className="kh-link-button" onClick={() => onMove(1)} disabled={!canMoveDown} aria-label="Descendre la question">
            ↓
          </button>
          <button type="button" className="kh-link-button" onClick={onDuplicate}>
            Dupliquer
          </button>
          <button type="button" className="kh-link-button" onClick={onRemove}>
            Supprimer
          </button>
        </div>
      </div>

      {expanded && (
        <div className="kh-question__body">
          <div className="field">
            <label htmlFor={`q-type-${question.id}`}>Type de question</label>
            <select
              id={`q-type-${question.id}`}
              value={question.type}
              onChange={(event) => onChangeType(event.target.value as QuestionType)}
            >
              <option value="multiple_choice">QCM</option>
              <option value="slider">Curseur</option>
              <option value="map_pin">Carte</option>
            </select>
          </div>

          <CommonFields question={question} onChange={onChange} />

          {question.type === 'multiple_choice' && (
            <MultipleChoiceFields question={question} onChange={onChange as (patch: Partial<MultipleChoiceQuestion>) => void} />
          )}
          {question.type === 'slider' && <SliderFields question={question} onChange={onChange as (patch: Partial<SliderQuestion>) => void} />}
          {question.type === 'map_pin' && <MapPinFields question={question} onChange={onChange as (patch: Partial<MapPinQuestion>) => void} />}
        </div>
      )}
    </li>
  );
}
