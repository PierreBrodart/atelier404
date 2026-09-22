'use client';

import { ROLE_LABELS } from '@/lib/undercover/rules';
import type { Winner } from '@/lib/undercover/types';
import { Button } from '../ui/Button';
import { Confetti, PhaseHead, PlayerChip, Scoreboard, type ScreenProps } from './parts';

export const WINNER_TITLES: Record<Winner, string> = {
  CIVILS: 'Les Civils ont gagné !',
  UNDERCOVER: 'Les Undercover ont gagné !',
  MR_WHITE: 'Mr White a gagné !',
};

/** Fin de manche : verdict, mots révélés, rôles de chacun, scores, nouvelle manche. */
export function GameOver({ view, act }: ScreenProps) {
  const { room, me } = view;
  const { outcome, reveal } = room;
  if (!outcome || !reveal) return null;

  const players = room.players.filter((player) => !player.left || reveal.roles[player.id]);
  const host = room.players.find((player) => player.isHost);
  const iWon = outcome.winnerIds.includes(me.playerId);

  return (
    <div className="uc-over">
      <Confetti />
      <PhaseHead kicker={`Manche ${room.round} · Fin de partie`} title={WINNER_TITLES[outcome.winner]}>
        <p>{outcome.reason}</p>
        <p className="uc-over__me">{iWon ? 'Tu fais partie des vainqueurs. 🎉' : 'Pas cette fois : la prochaine sera la bonne.'}</p>
      </PhaseHead>

      <section className="uc-words" aria-label="Les mots de la manche" data-enter>
        <div className="uc-words__item uc-words__item--civil">
          <p>Mot des Civils</p>
          <strong>{reveal.civilianWord}</strong>
        </div>
        <div className="uc-words__item uc-words__item--under">
          <p>Mot des Undercover</p>
          <strong>{reveal.undercoverWord}</strong>
        </div>
      </section>

      <div className="uc-result__grid">
        <section className="uc-card" aria-labelledby="uc-roles-title" data-enter>
          <h3 id="uc-roles-title" className="uc-card__title">
            Qui était qui ?
          </h3>
          <ul className="uc-players">
            {players.map((player, index) => (
              <PlayerChip key={player.id} player={player} meId={me.playerId} index={index}>
                <span className={`uc-role-tag uc-role-tag--${reveal.roles[player.id]}`}>
                  {ROLE_LABELS[reveal.roles[player.id]]}
                  {outcome.winnerIds.includes(player.id) && <span className="sr-only"> (vainqueur)</span>}
                  {outcome.winnerIds.includes(player.id) && <span aria-hidden="true"> ★</span>}
                </span>
              </PlayerChip>
            ))}
          </ul>
        </section>

        <section className="uc-card" aria-label="Classement" data-enter>
          <Scoreboard players={room.players} roundScores={room.roundScores} />
        </section>
      </div>

      <div className="uc-actions" data-enter>
        {me.isHost ? (
          <Button onClick={() => act({ type: 'newRound' })}>Nouvelle manche</Button>
        ) : (
          <p className="uc-waiting" role="status">
            <span className="uc-dots" aria-hidden="true" /> {host?.name ?? 'L’hôte'} prépare la prochaine manche…
          </p>
        )}
      </div>
    </div>
  );
}
