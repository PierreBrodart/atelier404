'use client';

import { useState } from 'react';
import { Button } from '../ui/Button';
import { PhaseHead, PlayerChip, RoleCard, StatusMark, Toggle, type ScreenProps } from './parts';

/** Étape secrète : chacun retourne sa carte sur son propre téléphone. */
export function RoleReveal({ view, act }: ScreenProps) {
  const { room, me } = view;
  const [revealed, setRevealed] = useState(false);
  const self = room.players.find((player) => player.id === me.playerId);
  const ready = Boolean(self?.ready);
  const players = room.players.filter((player) => !player.left);

  if (!me.role) return null;
  const hideRole = !room.settings.revealRoles;

  return (
    <div className="uc-reveal">
      <PhaseHead kicker={`Manche ${room.round} · Étape secrète`} title={hideRole ? 'Ton mot.' : 'Ton rôle.'}>
        <p>
          {hideRole
            ? 'Vérifie que personne ne regarde ton écran, puis retourne ta carte : tu ne verras que ton mot, pas ton camp.'
            : 'Vérifie que personne ne regarde ton écran, puis retourne ta carte. Tu peux la recacher à tout moment.'}
        </p>
      </PhaseHead>

      <div data-enter>
        <RoleCard
          role={me.role}
          word={me.word}
          flipped={revealed}
          hideRole={hideRole}
          onClick={() => setRevealed((value) => !value)}
        />
      </div>

      <div className="uc-actions" data-enter>
        <Toggle label="Afficher mon mot" checked={revealed} onChange={setRevealed} states={['Caché', 'Visible']} />
        <Button onClick={() => act({ type: 'ready' })} disabled={ready}>
          {ready ? 'C’est noté, on attend les autres' : 'J’ai compris, je suis prêt'}
        </Button>
      </div>

      <section className="uc-card" aria-labelledby="uc-ready-title" data-enter>
        <h3 id="uc-ready-title" className="uc-card__title">
          Qui est prêt ?
        </h3>
        <ul className="uc-players">
          {players.map((player, index) => (
            <PlayerChip key={player.id} player={player} meId={me.playerId} index={index}>
              <StatusMark state={player.ready ? 'done' : 'wait'} labels={{ done: 'est prêt', wait: 'n’est pas encore prêt' }} />
            </PlayerChip>
          ))}
        </ul>
      </section>
    </div>
  );
}
