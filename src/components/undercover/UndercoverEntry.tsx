'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { LAST_ROOM_KEY, NAME_KEY, api, loadSession, saveSession, storage, useBrowserValue } from '@/lib/undercover/client';
import type { JoinResponse } from '@/lib/undercover/types';
import { Button } from '../ui/Button';
import { TLink } from '../layout/PageTransition';

/** Point d'entrée du jeu : prénom, créer une room, ou rejoindre avec un code. */
export function UndercoverEntry() {
  const router = useRouter();
  const savedName = useBrowserValue(() => storage.get(NAME_KEY) ?? '');
  const [typedName, setName] = useState<string | null>(null);
  const name = typedName ?? savedName;
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [errors, setErrors] = useState<{ name?: string; code?: string; form?: string }>({});
  const resumeCode = useBrowserValue(() => {
    const last = storage.get(LAST_ROOM_KEY);
    return last && loadSession(last) ? last : '';
  });
  const resume = resumeCode || null;

  const checkName = () => {
    if (name.trim().length < 2) {
      setErrors({ name: 'Choisis un prénom de 2 à 16 caractères.' });
      document.getElementById('uc-name')?.focus();
      return false;
    }
    storage.set(NAME_KEY, name.trim());
    return true;
  };

  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!checkName()) return;
    setBusy('create');
    setErrors({});
    const result = await api<JoinResponse>({ type: 'create', name });
    if (!result.ok) {
      setErrors({ form: result.error });
      setBusy(null);
      return;
    }
    saveSession(result);
    router.push(`/undercover/${result.code}`);
  };

  const join = async (event: FormEvent) => {
    event.preventDefault();
    if (!checkName()) return;
    const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length !== 5) {
      setErrors({ code: 'Le code contient 5 caractères (lettres et chiffres).' });
      document.getElementById('uc-code')?.focus();
      return;
    }
    setBusy('join');
    setErrors({});
    const result = await api<JoinResponse>({ type: 'join', code: clean, name });
    if (!result.ok) {
      setErrors({ form: result.error });
      setBusy(null);
      return;
    }
    saveSession(result);
    router.push(`/undercover/${result.code}`);
  };

  return (
    <div className="uc-entry">
      {resume && (
        <p className="uc-entry__resume">
          Une partie est en cours sur ce navigateur.{' '}
          <TLink href={`/undercover/${resume}`} className="uc-link">
            Reprendre la room {resume}
          </TLink>
        </p>
      )}

      <div className={`field uc-entry__name${errors.name ? ' field--error' : ''}`}>
        <label htmlFor="uc-name">Ton prénom</label>
        <input
          id="uc-name"
          type="text"
          value={name}
          maxLength={16}
          autoComplete="given-name"
          onChange={(event) => setName(event.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'uc-name-error' : undefined}
        />
        {errors.name && (
          <p id="uc-name-error" className="field__error" role="alert">
            {errors.name}
          </p>
        )}
      </div>

      {errors.form && (
        <p className="form__summary" role="alert">
          {errors.form}
        </p>
      )}

      <div className="uc-entry__grid">
        <form className="uc-card uc-card--create" onSubmit={create} data-reveal="fade">
          <h3 className="uc-card__title">Créer une partie</h3>
          <p>Tu deviens le host : tu configures la partie et tu la lances.</p>
          <Button type="submit" disabled={busy !== null}>
            {busy === 'create' ? 'Création…' : 'Créer la room'}
          </Button>
        </form>

        <form className="uc-card uc-card--join" onSubmit={join} noValidate data-reveal="fade" data-reveal-delay="0.1">
          <h3 className="uc-card__title">Rejoindre une partie</h3>
          <div className={`field${errors.code ? ' field--error' : ''}`}>
            <label htmlFor="uc-code">Code de la room</label>
            <input
              id="uc-code"
              type="text"
              value={code}
              maxLength={5}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              inputMode="text"
              className="uc-code-input"
              placeholder="A4X7K"
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              aria-invalid={Boolean(errors.code)}
              aria-describedby={errors.code ? 'uc-code-error' : undefined}
            />
            {errors.code && (
              <p id="uc-code-error" className="field__error" role="alert">
                {errors.code}
              </p>
            )}
          </div>
          <Button type="submit" variant="ink" disabled={busy !== null}>
            {busy === 'join' ? 'Connexion…' : 'Rejoindre'}
          </Button>
        </form>
      </div>
    </div>
  );
}
