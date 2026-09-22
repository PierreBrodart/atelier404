'use client';

import { useEffect, useState } from 'react';
import { useBrowserValue } from '@/lib/undercover/client';
import { mrWhiteAvailable } from '@/lib/undercover/rules';
import type { ThemeInfo } from '@/lib/undercover/types';
import { Button } from '../ui/Button';
import { PhaseHead, PlayerChip, Scoreboard, Toggle, type ScreenProps } from './parts';

interface LobbyProps extends ScreenProps {
  themes: ThemeInfo[];
}

function Settings({ view, act, themes }: LobbyProps) {
  const { room } = view;
  const count = room.players.filter((player) => !player.left).length;
  const { themeId, mrWhiteCount, revealRoles } = room.settings;
  const canMrWhite = mrWhiteAvailable(count);
  const update = (settings: Record<string, string | number | boolean>) => act({ type: 'updateSettings', settings });

  return (
    <div className="uc-settings">
      <fieldset className="uc-fieldset">
        <legend>Thème des mots</legend>
        <div className="uc-themes">
          <label className="uc-theme">
            <input type="radio" name="theme" value="random" checked={themeId === 'random'} onChange={() => update({ themeId: 'random' })} />
            <span>
              <span aria-hidden="true">🎲</span> Aléatoire
            </span>
          </label>
          {themes.map((theme) => (
            <label key={theme.id} className="uc-theme">
              <input type="radio" name="theme" value={theme.id} checked={themeId === theme.id} onChange={() => update({ themeId: theme.id })} />
              <span>
                <span aria-hidden="true">{theme.icon}</span> {theme.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="uc-fieldset">
        <legend>Imposteurs</legend>
        <p className="uc-hint">Il y a toujours 1 Undercover.</p>
        <Toggle
          label="Ajouter Mr White"
          checked={mrWhiteCount > 0}
          disabled={!canMrWhite && mrWhiteCount === 0}
          onChange={(value) => update({ mrWhiteCount: value ? 1 : 0 })}
          states={['Non', 'Oui']}
        />
        <p className="uc-hint">
          {canMrWhite
            ? 'Mr White peut s’ajouter à l’Undercover : les autres joueurs sont Civils.'
            : 'Pas assez de joueurs pour ajouter Mr White en plus de l’Undercover.'}
        </p>
      </fieldset>

      <fieldset className="uc-fieldset">
        <legend>Rôle</legend>
        <Toggle
          label="Voir son camp"
          checked={revealRoles}
          onChange={(value) => update({ revealRoles: value })}
          states={['Mot seul', 'Mot + camp']}
        />
        <p className="uc-hint">
          {revealRoles
            ? 'Chacun voit son mot et son camp (Civil, Undercover, Mr White).'
            : 'Chacun voit seulement son mot, pas son camp : plus dur de savoir si on est Civil ou Undercover.'}
        </p>
      </fieldset>
    </div>
  );
}

function CopyButton({ label, value, done }: { label: string; value: string; done: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <>
      <button
        type="button"
        className="uc-link-button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
          } catch {
            window.prompt('Copie ce texte :', value);
          }
        }}
      >
        {copied ? '✓ Copié' : label}
      </button>
      <span className="sr-only" role="status">
        {copied ? done : ''}
      </span>
    </>
  );
}

export function Lobby({ view, act, themes }: LobbyProps) {
  const { room, me } = view;
  const players = room.players.filter((player) => !player.left);
  const host = players.find((player) => player.isHost);
  const theme = themes.find((item) => item.id === room.settings.themeId);
  const enough = players.length >= room.limits.min;
  const origin = useBrowserValue(() => window.location.origin);
  const link = origin ? `${origin}/undercover/${room.code}` : '';

  return (
    <div className="uc-lobby">
      <PhaseHead kicker={`Manche ${room.round} · Lobby`} title="On attend la troupe.">
        <p>Partage le code ci-dessous : chacun rejoint depuis son téléphone.</p>
      </PhaseHead>

      <div className="uc-lobby__grid">
        <section className="uc-card uc-card--code" aria-labelledby="uc-code-title" data-enter>
          <h3 id="uc-code-title" className="uc-card__title">
            Code de la room
          </h3>
          <p className="uc-code" aria-label={`Code de la room : ${room.code.split('').join(' ')}`}>
            {room.code.split('').map((letter, index) => (
              <span key={index} aria-hidden="true">
                {letter}
              </span>
            ))}
          </p>
          <div className="uc-card__row">
            <CopyButton label="Copier le code" value={room.code} done="Code copié" />
            {link && <CopyButton label="Copier le lien" value={link} done="Lien copié" />}
          </div>
        </section>

        <section className="uc-card uc-card--players" aria-labelledby="uc-players-title" data-enter>
          <h3 id="uc-players-title" className="uc-card__title">
            Joueurs{' '}
            <span className="uc-count" aria-label={`${players.length} joueurs sur ${room.limits.max}`}>
              {players.length} / {room.limits.max}
            </span>
          </h3>
          <ul className="uc-players">
            {players.map((player, index) => (
              <PlayerChip key={player.id} player={player} meId={me.playerId} index={index} score={room.round > 1} />
            ))}
          </ul>
        </section>

        <section className="uc-card uc-card--settings" aria-labelledby="uc-settings-title" data-enter>
          <h3 id="uc-settings-title" className="uc-card__title">
            Configuration
          </h3>
          {me.isHost ? (
            <Settings view={view} act={act} themes={themes} />
          ) : (
            <dl className="uc-summary">
              <div>
                <dt>Thème</dt>
                <dd>{room.settings.themeId === 'random' ? '🎲 Aléatoire' : `${theme?.icon ?? ''} ${theme?.label ?? room.settings.themeId}`}</dd>
              </div>
              <div>
                <dt>Mr White</dt>
                <dd>{room.settings.mrWhiteCount > 0 ? 'Oui' : 'Non'}</dd>
              </div>
              <div>
                <dt>Rôle</dt>
                <dd>{room.settings.revealRoles ? 'Mot + camp' : 'Mot seul'}</dd>
              </div>
            </dl>
          )}
          <p className="uc-composition" data-valid={room.composition.valid}>
            {room.composition.civil} Civil{room.composition.civil > 1 ? 's' : ''} · {room.composition.undercover} Undercover ·{' '}
            {room.composition.mrWhite} Mr White
          </p>
        </section>
      </div>

      <div className="uc-actions" data-enter>
        {me.isHost ? (
          <>
            <Button onClick={() => act({ type: 'startGame' })} disabled={!enough || !room.composition.valid}>
              Lancer la partie
            </Button>
            {!enough && (
              <p className="uc-hint" role="status">
                Il faut au moins {room.limits.min} joueurs pour commencer.
              </p>
            )}
          </>
        ) : (
          <p className="uc-waiting" role="status">
            <span className="uc-dots" aria-hidden="true" /> En attente de {host?.name ?? 'l’hôte'}…
          </p>
        )}
      </div>

      {room.round > 1 && (
        <section className="uc-card" aria-label="Classement" data-enter>
          <Scoreboard players={room.players} />
        </section>
      )}
    </div>
  );
}
