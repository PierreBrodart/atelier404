'use client';

import { Button } from '../ui/Button';
import { HostForce, PhaseHead, PlayerChip, StatusMark, type ScreenProps } from './parts';

/** Débat libre : rappel des indices, puis chacun se déclare prêt à voter. */
export function Discussion({ view, act }: ScreenProps) {
  const { room, me } = view;
  const self = room.players.find((player) => player.id === me.playerId);
  const alive = room.players.filter((player) => player.alive && !player.left);
  const nameOf = (id: string) => room.players.find((player) => player.id === id)?.name ?? '';

  return (
    <div className="uc-discussion">
      <PhaseHead kicker={`Tour ${room.turn} · Discussion`} title="Qui ment ici ?">
        <p>Débattez ! Repérez l’indice qui sonne faux, celui qui est trop vague, ou trop précis.</p>
      </PhaseHead>

      <section className="uc-card" aria-labelledby="uc-recap-title" data-enter>
        <h3 id="uc-recap-title" className="uc-card__title">
          Rappel des indices
        </h3>
        <ul className="uc-recap">
          {room.clueOrder.map((id) => {
            const clue = room.clues.find((entry) => entry.playerId === id);
            if (!clue) return null;
            return (
              <li key={id}>
                <strong>{nameOf(id)}</strong>
                <span>{clue.skipped ? 'a passé son tour' : clue.text ? `« ${clue.text} »` : 'indice donné à l’oral'}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="uc-card" aria-labelledby="uc-vote-ready-title" data-enter>
        <h3 id="uc-vote-ready-title" className="uc-card__title">
          Prêts à voter ?
        </h3>
        <ul className="uc-players">
          {alive.map((player, index) => (
            <PlayerChip key={player.id} player={player} meId={me.playerId} index={index}>
              <StatusMark state={player.ready ? 'done' : 'wait'} labels={{ done: 'est prêt à voter', wait: 'discute encore' }} />
            </PlayerChip>
          ))}
        </ul>
      </section>

      <div className="uc-actions" data-enter>
        {self?.alive ? (
          <Button onClick={() => act({ type: 'ready' })} disabled={self.ready}>
            {self.ready ? 'On attend les autres…' : 'Je suis prêt à voter'}
          </Button>
        ) : (
          <p className="uc-waiting">Tu es éliminé : tu observes le débat.</p>
        )}
      </div>

      <HostForce view={view} act={act} label="Passer directement au vote" />
    </div>
  );
}
