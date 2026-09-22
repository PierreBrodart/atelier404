'use client';

import dynamic from 'next/dynamic';
import type { MapPinQuestion, MultipleChoiceQuestion, SliderQuestion } from '@/lib/kahoot/types';

const MapPicker = dynamic(() => import('../MapPicker'), { ssr: false, loading: () => <p className="kh-map-loading">Carte…</p> });

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function MultipleChoiceAnswer({
  question,
  selected,
  onChange,
  reveal,
  disabled,
}: {
  question: MultipleChoiceQuestion;
  selected: string[];
  onChange: (ids: string[]) => void;
  reveal?: boolean;
  disabled?: boolean;
}) {
  const multi = question.correctAnswerIds.length > 1;
  const toggle = (id: string) => {
    if (disabled) return;
    if (multi) {
      const set = new Set(selected);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      onChange([...set]);
    } else {
      onChange([id]);
    }
  };

  return (
    <ul className="kh-choices" data-reveal={reveal || undefined}>
      {question.answers.map((answer, index) => {
        const isSelected = selected.includes(answer.id);
        const isCorrect = question.correctAnswerIds.includes(answer.id);
        return (
          <li key={answer.id}>
            <button
              type="button"
              className="kh-choice"
              data-tone={index % 4}
              data-selected={isSelected || undefined}
              data-correct={reveal ? isCorrect || undefined : undefined}
              data-wrong={reveal && isSelected && !isCorrect ? true : undefined}
              onClick={() => toggle(answer.id)}
              disabled={disabled}
              aria-pressed={isSelected}
            >
              <span className="kh-choice__letter" aria-hidden="true">
                {LETTERS[index]}
              </span>
              <span className="kh-choice__text">{answer.text}</span>
              {reveal && isCorrect && (
                <span className="kh-choice__mark" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function SliderAnswer({
  question,
  value,
  onChange,
  reveal,
  disabled,
}: {
  question: SliderQuestion;
  value: number;
  onChange: (value: number) => void;
  reveal?: boolean;
  disabled?: boolean;
}) {
  const percentOf = (v: number) => ((v - question.min) / (question.max - question.min)) * 100;
  return (
    <div className="kh-slider">
      <p className="kh-slider__value" aria-live="polite">
        {value}
        {question.unit ? ` ${question.unit}` : ''}
      </p>
      <input
        type="range"
        min={question.min}
        max={question.max}
        step={question.step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={`Valeur entre ${question.min} et ${question.max}`}
      />
      <div className="kh-slider__scale" aria-hidden="true">
        <span>
          {question.min}
          {question.unit ?? ''}
        </span>
        <span>
          {question.max}
          {question.unit ?? ''}
        </span>
      </div>
      {reveal && (
        <div className="kh-slider__reveal" aria-hidden="true">
          <span className="kh-slider__marker kh-slider__marker--correct" style={{ left: `${percentOf(question.correctValue)}%` }} />
          <span className="kh-slider__marker kh-slider__marker--mine" style={{ left: `${percentOf(value)}%` }} />
        </div>
      )}
      {reveal && (
        <p className="kh-slider__answer">
          Bonne réponse : <strong>{question.correctValue}{question.unit ? ` ${question.unit}` : ''}</strong>
        </p>
      )}
    </div>
  );
}

export function MapPinAnswer({
  question,
  value,
  onChange,
  reveal,
  disabled,
}: {
  question: MapPinQuestion;
  value: { lat: number; lng: number } | null;
  onChange: (lat: number, lng: number) => void;
  reveal?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="kh-mapfields">
      {!reveal && <p className="kh-hint">Touche la carte pour placer ton repère, puis valide ta réponse.</p>}
      <MapPicker
        value={value}
        onPick={disabled ? undefined : onChange}
        reference={reveal ? { lat: question.lat, lng: question.lng } : null}
        readOnly={disabled}
        className="kh-map kh-map--play"
      />
    </div>
  );
}
