'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, type CSSProperties, type DragEvent } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import type { AccentName } from '@/data/types';
import { accentVar } from '@/lib/accent';
import { createKahoot, updateKahoot } from '@/lib/kahoot/client';
import { LIMITS } from '@/lib/kahoot/rules';
import type { Kahoot, Question, QuestionType } from '@/lib/kahoot/types';
import { shortId, type KahootDraft } from '@/lib/kahoot/validate';
import { PlayRunner } from '@/components/kahoot/play/PlayRunner';
import { changeQuestionType, emptyQuestion, QuestionEditor } from './QuestionEditor';

const ACCENTS: { id: AccentName; label: string }[] = [
  { id: 'tomato', label: 'Tomate' },
  { id: 'sun', label: 'Soleil' },
  { id: 'blue', label: 'Bleu' },
  { id: 'mint', label: 'Menthe' },
  { id: 'pink', label: 'Rose' },
  { id: 'ink', label: 'Encre' },
];

/** Erreurs simples détectées côté client avant l'envoi (le serveur revalide de toute façon). */
function quickCheck(title: string, questions: Question[]): string | null {
  if (title.trim().length < LIMITS.titleMin) return `Le titre doit faire au moins ${LIMITS.titleMin} caractères.`;
  if (questions.length < LIMITS.questionsMin) return 'Ajoute au moins une question.';
  for (const [i, question] of questions.entries()) {
    if (!question.question.trim()) return `Question ${i + 1} : le texte de la question est vide.`;
    if (question.type === 'multiple_choice') {
      if (question.answers.some((answer) => !answer.text.trim())) return `Question ${i + 1} : une proposition est vide.`;
      if (question.correctAnswerIds.length === 0) return `Question ${i + 1} : coche au moins une bonne réponse.`;
    }
  }
  return null;
}

export function Editor({ editorKey, initial }: { editorKey: string; initial: Kahoot | null }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [accent, setAccent] = useState<AccentName>(initial?.settings.accent ?? 'sun');
  const [backgroundImage, setBackgroundImage] = useState(initial?.settings.backgroundImage ?? '');
  const [questions, setQuestions] = useState<Question[]>(initial?.questions ?? [emptyQuestion('multiple_choice')]);
  const [expandedId, setExpandedId] = useState<string | null>(questions[0]?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [preview, setPreview] = useState(false);
  const dragId = useRef<string | null>(null);

  const patchQuestion = (id: string, patch: Partial<Question>) => {
    setQuestions((list) => list.map((question) => (question.id === id ? ({ ...question, ...patch } as Question) : question)));
  };

  const onChangeType = (id: string, type: QuestionType) => {
    setQuestions((list) => list.map((question) => (question.id === id ? changeQuestionType(question, type) : question)));
  };

  const addQuestion = () => {
    if (questions.length >= LIMITS.questionsMax) return;
    const question = emptyQuestion('multiple_choice');
    setQuestions((list) => [...list, question]);
    setExpandedId(question.id);
  };

  const duplicateQuestion = (id: string) => {
    setQuestions((list) => {
      const index = list.findIndex((question) => question.id === id);
      if (index === -1 || list.length >= LIMITS.questionsMax) return list;
      const copy: Question = { ...list[index], id: shortId() };
      const next = [...list];
      next.splice(index + 1, 0, copy);
      return next;
    });
  };

  const removeQuestion = (id: string) => {
    setQuestions((list) => (list.length <= LIMITS.questionsMin ? list : list.filter((question) => question.id !== id)));
  };

  const moveQuestion = (id: string, direction: -1 | 1) => {
    setQuestions((list) => {
      const index = list.findIndex((question) => question.id === id);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const reorder = (targetId: string) => {
    const draggedId = dragId.current;
    if (!draggedId || draggedId === targetId) return;
    setQuestions((list) => {
      const from = list.findIndex((question) => question.id === draggedId);
      const to = list.findIndex((question) => question.id === targetId);
      if (from === -1 || to === -1) return list;
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const buildDraft = (): KahootDraft => ({
    title: title.trim(),
    description: description.trim(),
    settings: { accent, backgroundImage: backgroundImage.trim() || null },
    questions,
  });

  const save = async () => {
    const issue = quickCheck(title, questions);
    if (issue) {
      setError(issue);
      return;
    }
    setSaving(true);
    setError(null);
    const draft = buildDraft();
    const result = initial ? await updateKahoot(editorKey, initial.id, draft) : await createKahoot(editorKey, draft);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSavedAt(Date.now());
    if (!initial) router.replace(`/kahoot/${editorKey}/${result.kahoot.id}`);
    else router.refresh();
  };

  const previewKahoot: Kahoot = {
    id: initial?.id ?? 'preview',
    title: title || 'Sans titre',
    description,
    type: 'manual',
    createdAt: initial?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: { accent, backgroundImage: backgroundImage.trim() || null },
    questions,
  };

  if (preview) {
    return (
      <div className="kh-editor kh-editor--preview" data-accent={accent}>
        <p className="kh-editor__preview-tag">Aperçu — rien n’est encore sauvegardé</p>
        <PlayRunner kahoot={previewKahoot} preview onExit={() => setPreview(false)} />
      </div>
    );
  }

  return (
    <div className="kh-editor">
      <header className="kh-editor__head">
        <ButtonLink href={`/kahoot/${editorKey}`} variant="ghost">
          ← Tableau de bord
        </ButtonLink>
        <h1 className="kh-title">{initial ? 'Modifier le Kahoot' : 'Nouveau Kahoot'}</h1>
      </header>

      <section className="kh-editor__section" aria-labelledby="kh-general-title">
        <h2 id="kh-general-title" className="kh-editor__section-title">
          Informations générales
        </h2>
        <div className="field">
          <label htmlFor="kh-title">Titre</label>
          <input id="kh-title" type="text" value={title} maxLength={LIMITS.titleMax} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="kh-description">Description (facultatif)</label>
          <textarea
            id="kh-description"
            value={description}
            maxLength={LIMITS.descriptionMax}
            rows={2}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="kh-bg">Image de fond (URL, facultatif)</label>
          <input
            id="kh-bg"
            type="url"
            inputMode="url"
            placeholder="https://…"
            value={backgroundImage}
            onChange={(event) => setBackgroundImage(event.target.value)}
          />
        </div>
        <fieldset className="kh-accents">
          <legend>Couleur</legend>
          <div className="kh-accents__grid">
            {ACCENTS.map((option) => (
              <label key={option.id} className="kh-accent" style={{ '--swatch': accentVar(option.id) } as CSSProperties}>
                <input type="radio" name="kh-accent" checked={accent === option.id} onChange={() => setAccent(option.id)} />
                <span className="kh-accent__swatch" aria-hidden="true" />
                <span className="sr-only">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="kh-editor__section" aria-labelledby="kh-questions-title">
        <div className="kh-editor__section-head">
          <h2 id="kh-questions-title" className="kh-editor__section-title">
            Questions ({questions.length})
          </h2>
          <button type="button" className="kh-link-button" onClick={addQuestion} disabled={questions.length >= LIMITS.questionsMax}>
            + Ajouter une question
          </button>
        </div>
        <ul className="kh-questions">
          {questions.map((question, index) => (
            <QuestionEditor
              key={question.id}
              question={question}
              index={index}
              expanded={expandedId === question.id}
              onToggle={() => setExpandedId(expandedId === question.id ? null : question.id)}
              onChange={(patch) => patchQuestion(question.id, patch)}
              onChangeType={(type) => onChangeType(question.id, type)}
              onDuplicate={() => duplicateQuestion(question.id)}
              onRemove={() => removeQuestion(question.id)}
              onMove={(direction) => moveQuestion(question.id, direction)}
              canMoveUp={index > 0}
              canMoveDown={index < questions.length - 1}
              dragHandleProps={{
                draggable: true,
                onDragStart: () => {
                  dragId.current = question.id;
                },
                onDragOver: (event: DragEvent) => event.preventDefault(),
                onDrop: () => reorder(question.id),
                onDragEnd: () => {
                  dragId.current = null;
                },
              }}
            />
          ))}
        </ul>
      </section>

      {error && (
        <p className="form__summary" role="alert">
          {error}
        </p>
      )}

      <div className="kh-actions kh-editor__actions">
        <Button onClick={save} disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
        <button type="button" className="kh-link-button" onClick={() => setPreview(true)}>
          Prévisualiser / Jouer
        </button>
        {savedAt && !error && (
          <span className="kh-hint" role="status">
            Enregistré.
          </span>
        )}
      </div>
    </div>
  );
}
