'use client';

import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import { SKIP_VOTE } from '@/lib/undercover/rules';
import { PhaseHead, type ScreenProps } from './parts';

/** Délai avant que la suite s'enchaîne toute seule, sans clic de l'hôte. */
const AUTO_CONTINUE_DELAY = 3200;

/** Dépouillement : qui a voté pour qui, égalité éventuelle, désigné du tour. */
export function VoteResult({ view, act }: ScreenProps) {
  const { room, me } = view;
  const result = room.voteResult;

  // La partie s'enchaîne toute seule : l'hôte n'a rien à valider.
  useEffect(() => {
    if (!me.isHost || !result) return;
    const timer = window.setTimeout(() => act({ type: 'next' }), AUTO_CONTINUE_DELAY);
    return () => window.clearTimeout(timer);
  }, [me.isHost, result, act]);

  if (!result) return null;

  const nameOf = (id: string) => (id === SKIP_VOTE ? 'Passer' : (room.players.find((player) => player.id === id)?.name ?? '?'));
  const maxVotes = Math.max(1, ...Object.values(result.tallies));
  const tally = Object.entries(result.tallies).sort((a, b) => b[1] - a[1]);
  const skippedOutright = result.outcome === 'noElimination' && (result.tallies[SKIP_VOTE] ?? 0) >= maxVotes && (result.tallies[SKIP_VOTE] ?? 0) > 0;

  const title =
    result.outcome === 'tie'
      ? 'Égalité !'
      : result.outcome === 'eliminated' && result.eliminatedId
        ? `${nameOf(result.eliminatedId)} est désigné.`
        : 'Personne ne part.';
  const lead =
    result.outcome === 'tie'
      ? `${result.tiedIds.map(nameOf).join(' et ')} ont autant de voix : on revote entre eux.`
      : result.outcome === 'eliminated'
        ? 'Les votes sont tombés. Retournons sa carte…'
        : skippedOutright
          ? 'Le groupe a choisi de n’éliminer personne ce tour-ci : la partie continue.'
          : 'Égalité persistante : aucune élimination ce tour-ci, la partie continue.';
  const next =
    result.outcome === 'tie' ? 'Lancer le nouveau vote' : result.outcome === 'eliminated' ? 'Retourner la carte' : 'Nouveau tour d’indices';

  return (
    <div className="uc-result">
      <PhaseHead kicker={`Tour ${room.turn} · Résultat du vote`} title={title}>
        <p>{lead}</p>
      </PhaseHead>

      <div className="uc-result__grid">
        <section className="uc-card" aria-labelledby="uc-tally-title" data-enter>
          <h3 id="uc-tally-title" className="uc-card__title">
            Décompte
          </h3>
          <ul className="uc-tally">
            {tally.map(([id, count], index) => (
              <li key={id} style={{ '--i': index, '--w': `${(count / maxVotes) * 100}%` } as CSSProperties}>
                <span className="uc-tally__name">{nameOf(id)}</span>
                <span className="uc-tally__bar" aria-hidden="true" />
                <span className="uc-tally__count">
                  {count} voix
                </span>
              </li>
            ))}
            {tally.length === 0 && <li>Aucun vote enregistré.</li>}
          </ul>
        </section>

        <section className="uc-card" aria-labelledby="uc-ballots-title" data-enter>
          <h3 id="uc-ballots-title" className="uc-card__title">
            Qui a voté pour qui
          </h3>
          <ul className="uc-ballots">
            {result.ballots.map((ballot, index) => (
              <li key={ballot.voterId} style={{ '--i': index } as CSSProperties}>
                <strong>{nameOf(ballot.voterId)}</strong>
                <span aria-label="a voté pour"> → </span>
                <span>{nameOf(ballot.targetId)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="uc-actions" data-enter>
        <p className="uc-waiting" role="status">
          <span className="uc-dots" aria-hidden="true" /> {next}…
        </p>
      </div>
    </div>
  );
}
