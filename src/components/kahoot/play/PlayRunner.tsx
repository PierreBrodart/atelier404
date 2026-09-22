'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import type { ScoreOutcome } from '@/lib/kahoot/scoring';
import { scoreForQuestion, type Answer } from '@/lib/kahoot/scoring';
import type { Kahoot, Question, QuestionResult } from '@/lib/kahoot/types';
import { MapPinAnswer, MultipleChoiceAnswer, SliderAnswer } from './Answers';

/**
 * Déroulé d'une partie, entièrement local (pas d'adversaire réseau pour l'instant — voir
 * `lib/kahoot/scoring.ts`). Utilisé à la fois pour « Jouer » depuis /kahoot/jouer/[id] et
 * pour la prévisualisation dans l'éditeur (le Kahoot n'a alors pas encore été sauvegardé).
 */

type Stage = 'intro' | 'question' | 'reveal' | 'results';

function defaultSliderValue(question: Question): number {
  return question.type === 'slider' ? Math.round((question.min + question.max) / 2 / question.step) * question.step : 0;
}

export function PlayRunner({ kahoot, onExit, preview }: { kahoot: Kahoot; onExit?: () => void; preview?: boolean }) {
  const [stage, setStage] = useState<Stage>('intro');
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [mcSelected, setMcSelected] = useState<string[]>([]);
  const [sliderValue, setSliderValue] = useState(0);
  const [pinValue, setPinValue] = useState<{ lat: number; lng: number } | null>(null);
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [locked, setLocked] = useState(false);
  const [outcome, setOutcome] = useState<ScoreOutcome | null>(null);

  const question = kahoot.questions[index] as Question | undefined;
  const maxScore = useMemo(() => kahoot.questions.reduce((sum, q) => sum + q.points, 0), [kahoot.questions]);
  const totalScore = useMemo(() => results.reduce((sum, r) => sum + r.score, 0), [results]);

  useEffect(() => {
    if (stage !== 'question') return;
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [stage]);

  const timeLeftMs = Math.max(0, deadline - now);

  useEffect(() => {
    if (stage === 'question' && timeLeftMs <= 0 && !locked) lockAnswer(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeftMs, stage, locked]);

  function goToQuestion(i: number) {
    const q = kahoot.questions[i];
    setIndex(i);
    setMcSelected([]);
    setSliderValue(defaultSliderValue(q));
    setPinValue(null);
    setLocked(false);
    setOutcome(null);
    setNow(Date.now());
    setDeadline(Date.now() + q.timeLimit * 1000);
    setStage('question');
  }

  function start() {
    setResults([]);
    goToQuestion(0);
  }

  function currentAnswer(): Answer {
    if (!question) return { type: 'none' };
    if (question.type === 'multiple_choice') return { type: 'multiple_choice', selectedIds: mcSelected };
    if (question.type === 'slider') return { type: 'slider', value: sliderValue };
    if (question.type === 'map_pin' && pinValue) return { type: 'map_pin', lat: pinValue.lat, lng: pinValue.lng };
    return { type: 'none' };
  }

  function lockAnswer(timedOut: boolean) {
    if (locked || !question) return;
    setLocked(true);
    const answer = currentAnswer();
    const scored = timedOut ? { score: 0, correct: false } : scoreForQuestion(question, answer, timeLeftMs);
    setOutcome(scored);
    setResults((list) => [...list, { questionId: question.id, score: scored.score, correct: scored.correct, timedOut }]);
    setStage('reveal');
  }

  function next() {
    if (index + 1 >= kahoot.questions.length) setStage('results');
    else goToQuestion(index + 1);
  }

  const canValidate = question
    ? question.type === 'multiple_choice'
      ? mcSelected.length > 0
      : question.type === 'map_pin'
        ? pinValue !== null
        : true
    : false;

  if (stage === 'intro') {
    return (
      <div className="kh-play kh-play--intro">
        <h2 className="kh-title">{kahoot.title}</h2>
        {kahoot.description && <p className="kh-play__desc">{kahoot.description}</p>}
        <p className="kh-hint">{kahoot.questions.length} question{kahoot.questions.length > 1 ? 's' : ''}</p>
        <div className="kh-actions">
          <Button onClick={start}>{preview ? 'Prévisualiser' : 'Jouer'}</Button>
          {onExit && (
            <button type="button" className="kh-link-button" onClick={onExit}>
              Annuler
            </button>
          )}
        </div>
      </div>
    );
  }

  if (stage === 'results') {
    return (
      <div className="kh-play kh-play--results">
        <h2 className="kh-title">Résultats</h2>
        <p className="kh-play__score">
          {totalScore} <span>/ {maxScore} points</span>
        </p>
        <ol className="kh-results">
          {kahoot.questions.map((q, i) => {
            const result = results[i];
            return (
              <li key={q.id} data-correct={result?.correct || undefined}>
                <span className="kh-results__q">{q.question}</span>
                <span className="kh-results__score">
                  {result?.timedOut ? 'Temps écoulé' : `${result?.score ?? 0} pt`}
                </span>
              </li>
            );
          })}
        </ol>
        <div className="kh-actions">
          <Button onClick={start}>Rejouer</Button>
          {onExit ? (
            <button type="button" className="kh-link-button" onClick={onExit}>
              Fermer
            </button>
          ) : (
            <ButtonLink href="/kahoot" variant="ghost">
              Retour à Kahoot
            </ButtonLink>
          )}
        </div>
      </div>
    );
  }

  if (!question) return null;
  const reveal = stage === 'reveal';

  return (
    <div className="kh-play kh-play--question" data-type={question.type}>
      <header className="kh-play__head">
        <p className="kh-play__progress">
          Question {index + 1} / {kahoot.questions.length}
        </p>
        {!reveal && (
          <div className="kh-timer" role="timer" aria-label={`${Math.ceil(timeLeftMs / 1000)} secondes restantes`}>
            <span className="kh-timer__bar" style={{ transform: `scaleX(${Math.max(0, timeLeftMs / (question.timeLimit * 1000))})` }} />
            <span className="kh-timer__value" aria-hidden="true">
              {Math.ceil(timeLeftMs / 1000)}
            </span>
          </div>
        )}
      </header>

      {question.image && (
        // eslint-disable-next-line @next/next/no-img-element -- URL externe arbitraire (voir lib/kahoot/validate.ts) : next/image exige une liste de domaines.
        <img src={question.image} alt="" className="kh-play__image" loading="lazy" onError={(event) => (event.currentTarget.style.display = 'none')} />
      )}

      <h2 className="kh-title kh-play__question">{question.question}</h2>

      {question.type === 'multiple_choice' && (
        <MultipleChoiceAnswer question={question} selected={mcSelected} onChange={setMcSelected} reveal={reveal} disabled={reveal} />
      )}
      {question.type === 'slider' && (
        <SliderAnswer question={question} value={sliderValue} onChange={setSliderValue} reveal={reveal} disabled={reveal} />
      )}
      {question.type === 'map_pin' && (
        <MapPinAnswer question={question} value={pinValue} onChange={(lat, lng) => setPinValue({ lat, lng })} reveal={reveal} disabled={reveal} />
      )}

      {!reveal && (
        <div className="kh-actions">
          <Button onClick={() => lockAnswer(false)} disabled={!canValidate}>
            Valider ma réponse
          </Button>
        </div>
      )}

      {reveal && outcome && (
        <div className="kh-reveal" role="status">
          <p className="kh-reveal__score" data-correct={outcome.correct || undefined}>
            {outcome.correct ? 'Bonne réponse !' : outcome.score > 0 ? 'Pas tout à fait…' : 'Raté !'} +{outcome.score} pt
          </p>
          {question.explanation && <p className="kh-reveal__explanation">{question.explanation}</p>}
          {question.source && (
            <p className="kh-reveal__source">
              Source :{' '}
              <a href={question.source.url} target="_blank" rel="noopener noreferrer">
                {question.source.name}
              </a>
            </p>
          )}
          <div className="kh-actions">
            <Button onClick={next}>{index + 1 >= kahoot.questions.length ? 'Voir les résultats' : 'Question suivante'}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
