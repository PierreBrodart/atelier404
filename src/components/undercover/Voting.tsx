'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { HostForce, PhaseHead, PlayerChip, StatusMark, type ScreenProps } from './parts';

/** Vote secret : un joueur, une voix, pas de retour en arrière. */
export function Voting({ view, act }: ScreenProps) {
  const { room, me } = view;
  const [choice, setChoice] = useState('');
  const voting = room.voting;
  const self = room.players.find((player) => player.id === me.playerId);
  const alive = room.players.filter((player) => player.alive && !player.left);
  const candidates = alive.filter((player) => player.id !== me.playerId && (!voting?.candidates || voting.candidates.includes(player.id)));
  const voted = me.myVote !== null;
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
            </div>
          </fieldset>
          <Button type="submit" disabled={!choice}>
            Valider mon vote
          </Button>
        </form>
      )}

      {self?.alive && voted && (
        <div className="uc-stamp" role="status" data-enter>
          <p className="uc-stamp__title">Vote enregistré</p>
          <p>Tu as voté contre {votedFor?.name}. Il n’est plus possible de changer.</p>
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
