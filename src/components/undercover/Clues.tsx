'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { HostForce, PhaseHead, PlayerChip, StatusMark, type ScreenProps } from './parts';

/** Les indices se donnent chacun son tour, dans un ordre tiré au sort. */
export function Clues({ view, act }: ScreenProps) {
  const { room, me } = view;
  const [text, setText] = useState('');
  const speaker = room.players.find((player) => player.id === room.currentSpeakerId);
  const myTurn = room.currentSpeakerId === me.playerId;
  const self = room.players.find((player) => player.id === me.playerId);
  const allSpoke = room.currentSpeakerId === null;
  const ordered = room.clueOrder
    .map((id) => room.players.find((player) => player.id === id))
    .filter((player): player is NonNullable<typeof player> => Boolean(player));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    act({ type: 'submitClue', text });
    setText('');
  };

  return (
    <div className="uc-clues">
      <PhaseHead
        kicker={`Tour ${room.turn} · Les indices`}
        title={allSpoke ? 'Tout le monde a parlé.' : myTurn ? 'À toi de jouer !' : `${speaker?.name ?? '…'} donne son indice.`}
      >
        {allSpoke ? (
          <p>Discutez de vive voix tant que vous voulez : c’est au host de lancer le vote quand la table est prête.</p>
        ) : (
          <p>
            Chacun son tour, donne un indice sur ton mot <strong>sans le dire</strong>. À l’oral ou par écrit : comme vous voulez.
          </p>
        )}
      </PhaseHead>

      <section className="uc-card" aria-labelledby="uc-order-title" data-enter>
        <h3 id="uc-order-title" className="uc-card__title">
          Ordre de passage
        </h3>
        <ol className="uc-players uc-players--ordered">
          {ordered.map((player, index) => {
            const clue = room.clues.find((entry) => entry.playerId === player.id);
            const state = clue ? 'done' : player.id === room.currentSpeakerId ? 'now' : 'wait';
            return (
              <PlayerChip key={player.id} player={player} meId={me.playerId} index={index}>
                {clue && !clue.skipped && (
                  <span className="uc-clue-text">{clue.text ? `« ${clue.text} »` : 'a donné son indice à l’oral'}</span>
                )}
                {clue?.skipped && <span className="uc-clue-text">a passé son tour</span>}
                <StatusMark state={state} labels={{ done: 'a donné son indice', wait: 'n’a pas encore donné son indice', now: 'est en train de donner son indice' }} />
              </PlayerChip>
            );
          })}
        </ol>
      </section>

      {myTurn && (
        <form className="uc-card uc-card--turn" onSubmit={submit} data-enter>
          <div className="field">
            <label htmlFor="uc-clue">Ton indice (facultatif si tu le dis à voix haute)</label>
            <input
              id="uc-clue"
              type="text"
              value={text}
              maxLength={40}
              autoComplete="off"
              autoFocus
              onChange={(event) => setText(event.target.value)}
              aria-describedby="uc-clue-hint"
            />
            <p id="uc-clue-hint" className="field__hint">
              Une seule idée, sans citer ton mot.
            </p>
          </div>
          <Button type="submit">J’ai donné mon indice</Button>
        </form>
      )}

      {!allSpoke && !myTurn && self?.alive && (
        <p className="uc-waiting" role="status" data-enter>
          <span className="uc-dots" aria-hidden="true" /> On écoute {speaker?.name ?? 'le prochain joueur'}…
        </p>
      )}
      {!self?.alive && (
        <p className="uc-waiting" data-enter>
          Tu es éliminé : tu observes la suite.
        </p>
      )}

      {allSpoke && (me.isHost || self?.alive) && (
        <div className="uc-actions" data-enter>
          {me.isHost ? (
            <Button onClick={() => act({ type: 'startVote' })}>Lancer le vote</Button>
          ) : (
            <p className="uc-waiting" role="status">
              <span className="uc-dots" aria-hidden="true" /> On attend que {room.players.find((player) => player.id === room.hostId)?.name ?? 'l’hôte'} lance le vote…
            </p>
          )}
        </div>
      )}

      {!allSpoke && <HostForce view={view} act={act} label={`Passer le tour de ${speaker?.name ?? 'ce joueur'}`} />}
    </div>
  );
}
