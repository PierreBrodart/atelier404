'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { cx } from '@/lib/cx';
import { LIMITS } from '@/lib/undercover/rules';
import { Button } from '../ui/Button';
import { HostForce, PhaseHead, PlayerChip, StatusMark, type ScreenProps } from './parts';

/**
 * Les indices se donnent chacun son tour, dans un ordre tiré au sort. On peut préparer le sien
 * pendant que les autres parlent : le brouillon reste sur le téléphone (jamais envoyé au serveur)
 * jusqu'à ce que ce soit son tour, où il suffit de le valider.
 */
export function Clues({ view, act }: ScreenProps) {
  const { room, me } = view;
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const speaker = room.players.find((player) => player.id === room.currentSpeakerId);
  const myTurn = room.currentSpeakerId === me.playerId;
  const self = room.players.find((player) => player.id === me.playerId);
  const spectator = me.seat !== 'player';
  const allSpoke = room.currentSpeakerId === null;
  const spoke = room.clues.some((entry) => entry.playerId === me.playerId);
  const canWrite = Boolean(self?.alive) && !spoke && !allSpoke;
  const ordered = room.clueOrder
    .map((id) => room.players.find((player) => player.id === id))
    .filter((player): player is NonNullable<typeof player> => Boolean(player));

  // Quand son tour arrive, le champ (et son éventuel brouillon) passe au premier plan —
  // sauf si le joueur est en train d'écrire ailleurs (le chat, par exemple).
  useEffect(() => {
    if (!myTurn) return;
    const active = document.activeElement;
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
    inputRef.current?.focus();
  }, [myTurn]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!myTurn || !text.trim()) return;
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
          <p>Débattez autant que vous voulez : c’est au host de lancer le vote quand la table est prête.</p>
        ) : (
          <p>
            Chacun son tour, écris un indice sur ton mot <strong>sans le dire</strong> : il s’affiche pour toute la table.
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
              <PlayerChip
                key={player.id}
                player={player}
                meId={me.playerId}
                index={index}
                order={index + 1}
                detail={clue && (clue.skipped ? 'a passé son tour' : `« ${clue.text} »`)}
              >
                <StatusMark state={state} labels={{ done: 'a donné son indice', wait: 'n’a pas encore donné son indice', now: 'est en train de donner son indice' }} />
              </PlayerChip>
            );
          })}
        </ol>
      </section>

      {/* Le même formulaire sert avant (brouillon) et pendant son tour : le texte tapé n'est jamais perdu. */}
      {canWrite && (
        <form className={cx('uc-card', myTurn ? 'uc-card--turn' : 'uc-card--draft')} onSubmit={submit} data-enter>
          <div className="field">
            <label htmlFor="uc-clue">
              {myTurn ? 'Ton indice' : 'Prépare ton indice en attendant ton tour'}
            </label>
            <input
              ref={inputRef}
              id="uc-clue"
              type="text"
              value={text}
              maxLength={LIMITS.clueMax}
              autoComplete="off"
              onChange={(event) => setText(event.target.value)}
              aria-describedby="uc-clue-hint"
            />
            <p id="uc-clue-hint" className="field__hint">
              {myTurn
                ? 'Une seule idée, sans citer ton mot.'
                : 'Personne ne le voit avant que tu l’envoies, et tu pourras encore le modifier quand ce sera ton tour.'}
            </p>
          </div>
          <Button type="submit" disabled={!myTurn || !text.trim()} aria-describedby="uc-clue-hint">
            {myTurn ? 'Envoyer mon indice' : 'Envoi possible à ton tour'}
          </Button>
        </form>
      )}

      {!allSpoke && !myTurn && self?.alive && spoke && (
        <p className="uc-waiting" role="status" data-enter>
          <span className="uc-dots" aria-hidden="true" /> On écoute {speaker?.name ?? 'le prochain joueur'}…
        </p>
      )}
      {!self?.alive && (
        <p className="uc-waiting" data-enter>
          {spectator ? 'Tu es spectateur : tu suis les indices de la table.' : 'Tu es éliminé : tu observes la suite.'}
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
