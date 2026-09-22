'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { ROLE_LABELS } from '@/lib/undercover/rules';
import { Button } from '../ui/Button';
import { HostForce, PhaseHead, RoleCard, type ScreenProps } from './parts';

/** Délai avant que la suite s'enchaîne toute seule, une fois la carte retournée. */
const AUTO_CONTINUE_DELAY = 2600;

/** Révélation du rôle de l'éliminé — et dernière chance de Mr White. */
export function Elimination({ view, act }: ScreenProps) {
  const { room, me } = view;
  const elimination = room.elimination;
  const [flipped, setFlipped] = useState(false);
  const [guess, setGuess] = useState('');

  // La carte se retourne toute seule après un court suspense
  useEffect(() => {
    const timer = window.setTimeout(() => setFlipped(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  const canContinue = flipped && Boolean(elimination) && !elimination?.awaitingGuess;

  // La partie s'enchaîne toute seule dès que la carte est retournée : l'hôte n'a rien à valider.
  useEffect(() => {
    if (!me.isHost || !canContinue) return;
    const timer = window.setTimeout(() => act({ type: 'next' }), AUTO_CONTINUE_DELAY);
    return () => window.clearTimeout(timer);
  }, [me.isHost, canContinue, act]);

  if (!elimination) return null;
  const victim = room.players.find((player) => player.id === elimination.playerId);
  const isVictim = elimination.playerId === me.playerId;
  const mrWhite = elimination.role === 'MR_WHITE';

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (guess.trim()) act({ type: 'guess', word: guess });
  };

  return (
    <div className="uc-elimination">
      <PhaseHead kicker={`Tour ${room.turn} · Élimination`} title={`${victim?.name ?? 'Un joueur'} quitte la partie.`}>
        <p>{flipped ? `C’était un·e ${ROLE_LABELS[elimination.role]}.` : 'Sa carte se retourne…'}</p>
      </PhaseHead>

      <div data-enter>
        <RoleCard role={elimination.role} word={null} flipped={flipped} name={victim?.name} frontLabel="Suspense…" />
      </div>

      {flipped && mrWhite && elimination.awaitingGuess && (
        <section className="uc-card uc-card--turn" aria-live="polite">
          {isVictim ? (
            <form onSubmit={submit}>
              <div className="field">
                <label htmlFor="uc-guess">Dernière chance : quel est le mot des Civils ?</label>
                <input id="uc-guess" type="text" value={guess} maxLength={40} autoComplete="off" autoFocus onChange={(event) => setGuess(event.target.value)} />
              </div>
              <Button type="submit" disabled={!guess.trim()}>
                Tenter ma chance
              </Button>
            </form>
          ) : (
            <p className="uc-waiting">
              <span className="uc-dots" aria-hidden="true" /> {victim?.name} tente de deviner le mot des Civils…
            </p>
          )}
        </section>
      )}

      {elimination.guess && (
        <p className="uc-stamp" role="status">
          <span className="uc-stamp__title">{elimination.guess.correct ? 'Bien joué !' : 'Raté !'}</span>
          {elimination.guess.word
            ? ` ${victim?.name} a répondu « ${elimination.guess.word} ».`
            : ` ${victim?.name} n’a pas répondu à temps.`}
        </p>
      )}

      {canContinue && (
        <div className="uc-actions">
          <p className="uc-waiting" role="status">
            <span className="uc-dots" aria-hidden="true" /> La partie continue…
          </p>
        </div>
      )}

      {elimination.awaitingGuess && <HostForce view={view} act={act} label="Passer la dernière chance de Mr White" />}
    </div>
  );
}
