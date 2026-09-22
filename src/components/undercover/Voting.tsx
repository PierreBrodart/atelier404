'use client';

import { useState, type FormEvent } from 'react';
import { SKIP_VOTE } from '@/lib/undercover/rules';
import { Button } from '../ui/Button';
import { ClueHistory, HostForce, PhaseHead, PlayerChip, StatusMark, type ScreenProps } from './parts';

/** Vote secret : un joueur, une voix (ou « Passer »), pas de retour en arrière. */
export function Voting({ view, act }: ScreenProps) {
  const { room, me } = view;
  const [choice, setChoice] = useState('');
  const voting = room.voting;
  const self = room.players.find((player) => player.id === me.playerId);
  const alive = room.players.filter((player) => player.alive && !player.left);
  const candidates = alive.filter((player) => player.id !== me.playerId && (!voting?.candidates || voting.candidates.includes(player.id)));
  const voted = me.myVote !== null;
  const votedForSkip = me.myVote === SKIP_VOTE;
  const votedFor = room.players.find((player) => player.id === me.myVote);
  const revote = (voting?.round ?? 1) > 1;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (choice) act({ type: 'vote', targetId: choice });
  };

  return (
    <div className="uc-voting">
      <PhaseHead kicker={`Tour ${room.turn} · Vote${revote ? ` (tour ${voting?.round})` : ''}`} title={revote ? 'Égalité ! On revote.' : 'Qui doit partir ?'}>
        <p>
          {revote
            ? 'Seuls les joueurs à égalité peuvent être désignés.'
            : 'Vote pour le joueur que tu soupçonnes. Ton vote est secret et définitif.'}
        </p>
      </PhaseHead>

      {room.clueOrder.length > 0 && (
        <section className="uc-card" aria-labelledby="uc-recap-title" data-enter>
          <h3 id="uc-recap-title" className="uc-card__title">
            Indices donnés
          </h3>
          <ul className="uc-recap">
            {room.clueOrder.map((id) => {
              const clue = room.clues.find((entry) => entry.playerId === id);
              if (!clue) return null;
              const player = room.players.find((entry) => entry.id === id);
              return (
                <li key={id}>
                  <strong>{player?.name}</strong>
                  <span>{clue.skipped ? 'a passé son tour' : clue.text ? `« ${clue.text} »` : 'indice donné à l’oral'}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <ClueHistory history={room.clueHistory} players={room.players} />

      {self?.alive && !voted && (
        <form className="uc-card" onSubmit={submit} data-enter>
          <fieldset className="uc-fieldset">
            <legend className="uc-card__title">Pour qui votes-tu ?</legend>
            <div className="uc-vote">
              {candidates.map((player) => (
                <label key={player.id} className="uc-vote__option">
                  <input type="radio" name="vote" value={player.id} checked={choice === player.id} onChange={() => setChoice(player.id)} />
                  <span className="uc-vote__card">
                    <span className="uc-vote__name">{player.name}</span>
                  </span>
                </label>
              ))}
              <label className="uc-vote__option uc-vote__option--skip">
                <input type="radio" name="vote" value={SKIP_VOTE} checked={choice === SKIP_VOTE} onChange={() => setChoice(SKIP_VOTE)} />
                <span className="uc-vote__card">
                  <span className="uc-vote__name">Passer</span>
                </span>
              </label>
            </div>
            <p className="uc-hint">« Passer » compte comme un vote pour n’éliminer personne ce tour-ci.</p>
          </fieldset>
          <Button type="submit" disabled={!choice}>
            Valider mon vote
          </Button>
        </form>
      )}

      {self?.alive && voted && (
        <div className="uc-stamp" role="status" data-enter>
          <p className="uc-stamp__title">Vote enregistré</p>
          <p>
            {votedForSkip ? 'Tu as choisi de passer.' : `Tu as voté contre ${votedFor?.name}.`} Il n’est plus possible de changer.
          </p>
        </div>
      )}

      {!self?.alive && (
        <p className="uc-waiting" data-enter>
          Tu es éliminé : tu ne votes plus.
        </p>
      )}

      <section className="uc-card" aria-labelledby="uc-progress-title" data-enter>
        <h3 id="uc-progress-title" className="uc-card__title">
          Votes reçus{' '}
          <span className="uc-count">
            {voting?.voted ?? 0} / {voting?.expected ?? alive.length}
          </span>
        </h3>
        <ul className="uc-players">
          {alive.map((player, index) => (
            <PlayerChip key={player.id} player={player} meId={me.playerId} index={index}>
              <StatusMark state={player.hasVoted ? 'done' : 'wait'} labels={{ done: 'a voté', wait: 'n’a pas encore voté' }} />
            </PlayerChip>
          ))}
        </ul>
      </section>

      <HostForce view={view} act={act} label="Clôturer le vote maintenant" />
    </div>
  );
}
