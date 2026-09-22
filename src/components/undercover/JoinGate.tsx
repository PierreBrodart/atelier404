'use client';

import { useState, type FormEvent } from 'react';
import { NAME_KEY, storage, useBrowserValue } from '@/lib/undercover/client';
import type { PeekResponse } from '@/lib/undercover/types';
import { Button, ButtonLink } from '../ui/Button';
import { PhaseHead } from './parts';
import { useEnter } from './useEnter';

interface JoinGateProps {
  code: string;
  peek: PeekResponse | null;
  join: (name: string) => Promise<string | null>;
}

/** Arrivée par un lien / un code : choix du prénom avant d'entrer dans la room. */
export function JoinGate({ code, peek, join }: JoinGateProps) {
  const savedName = useBrowserValue(() => storage.get(NAME_KEY) ?? '');
  const [typedName, setName] = useState<string | null>(null);
  const name = typedName ?? savedName;
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ref = useEnter<HTMLDivElement>('join');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    storage.set(NAME_KEY, name.trim());
    const result = await join(name);
    if (result) {
      setError(result);
      setBusy(false);
    }
  };

  const joinable = peek?.joinable ?? false;

  return (
    <section className="uc" data-phase="LOBBY">
      <div className="uc__inner container">
        <div ref={ref} className="uc__stage uc__stage--narrow">
          <PhaseHead kicker={`Room ${code}${peek ? ` · ${peek.playerCount} / ${peek.max} joueurs` : ''}`} title="Rejoindre la partie.">
            <p>{joinable ? 'Choisis ton prénom pour entrer dans la room.' : (peek?.reason ?? 'Cette room n’est pas accessible.')}</p>
          </PhaseHead>

          {joinable ? (
            <form className="uc-card" onSubmit={submit} noValidate data-enter>
              <div className={`field${error ? ' field--error' : ''}`}>
                <label htmlFor="uc-join-name">Ton prénom</label>
                <input
                  id="uc-join-name"
                  type="text"
                  value={name}
                  minLength={2}
                  maxLength={16}
                  autoComplete="given-name"
                  autoFocus
                  onChange={(event) => setName(event.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'uc-join-error' : undefined}
                />
                {error && (
                  <p id="uc-join-error" className="field__error" role="alert">
                    {error}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={busy || name.trim().length < 2}>
                {busy ? 'Connexion…' : 'Rejoindre'}
              </Button>
            </form>
          ) : (
            <div className="uc-actions" data-enter>
              <ButtonLink href="/undercover">Retour à l’accueil du jeu</ButtonLink>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
