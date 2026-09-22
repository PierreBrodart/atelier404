'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { gsap } from '@/lib/gsap';
import { ROLE_LABELS } from '@/lib/undercover/rules';
import type { ClientAction, PublicPlayer, Role, RoomView } from '@/lib/undercover/types';
import { usePrefersReducedMotion } from '@/lib/useReducedMotion';
import { Split } from '../ui/Split';

/** Props communes à tous les écrans de phase. */
export interface ScreenProps {
  view: RoomView;
  act: (action: ClientAction) => Promise<void>;
}

// ——— Titre de phase ————————————————————————————————————————————

export function PhaseHead({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <header className="uc-head">
      <p className="uc-head__kicker" data-enter>
        {kicker}
      </p>
      {/* Reçoit le focus à chaque changement de phase (lecteurs d'écran, clavier) */}
      <h2 id="uc-phase-title" className="uc-head__title" tabIndex={-1}>
        <Split text={title} reveal={null} />
      </h2>
      {children && (
        <div className="uc-head__lead" data-enter>
          {children}
        </div>
      )}
    </header>
  );
}

// ——— Joueurs ——————————————————————————————————————————————————

const AVATAR_TONES = 5;
const toneOf = (id: string) => [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % AVATAR_TONES;

interface PlayerChipProps {
  player: PublicPlayer;
  meId: string;
  index?: number;
  score?: boolean;
  children?: ReactNode;
}

export function PlayerChip({ player, meId, index = 0, score, children }: PlayerChipProps) {
  const offline = !player.connected && !player.left;
  return (
    <li
      className={cx(
        'uc-chip',
        player.id === meId && 'uc-chip--me',
        offline && 'uc-chip--offline',
        (!player.alive || player.left) && 'uc-chip--out',
      )}
      style={{ '--i': index } as CSSProperties}
    >
      <span className={`uc-avatar uc-avatar--${toneOf(player.id)}`} aria-hidden="true">
        {player.name.slice(0, 1).toUpperCase()}
      </span>
      <span className="uc-chip__body">
        <span className="uc-chip__name">{player.name}</span>
        <span className="uc-chip__tags">
          {player.isHost && <span className="uc-tag uc-tag--host">Host</span>}
          {player.id === meId && <span className="uc-tag">Toi</span>}
          {player.left && <span className="uc-tag uc-tag--off">Parti</span>}
          {offline && <span className="uc-tag uc-tag--off">{player.away ? 'Absent' : 'Reconnexion…'}</span>}
          {score && <span className="uc-tag uc-tag--score">{player.score} pt</span>}
        </span>
      </span>
      {children}
    </li>
  );
}

/** État d'un joueur dans une liste : toujours accompagné d'un texte (jamais la couleur seule). */
export function StatusMark({ state, labels }: { state: 'done' | 'wait' | 'now'; labels: { done: string; wait: string; now?: string } }) {
  const text = state === 'done' ? labels.done : state === 'now' ? (labels.now ?? labels.wait) : labels.wait;
  return (
    <span className={`uc-status uc-status--${state}`}>
      <span aria-hidden="true">{state === 'done' ? '✓' : state === 'now' ? '▶' : '…'}</span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

// ——— Carte de rôle (retournable) ———————————————————————————————————

const ROLE_HINTS: Record<Role, string> = {
  CIVIL: 'Trouve les imposteurs sans trop dévoiler ton mot.',
  UNDERCOVER: 'Ton mot est presque le leur : fonds-toi dans la masse.',
  MR_WHITE: 'Écoute les indices des autres et bluffe : tu peux gagner en devinant le mot.',
};

interface RoleCardProps {
  role: Role;
  word: string | null;
  flipped: boolean;
  /** Nom affiché au-dessus du rôle (élimination) */
  name?: string;
  kicker?: string;
  /** Texte de la face cachée */
  frontLabel?: string;
  onClick?: () => void;
  /** Si true, ne révèle que le mot : le camp (et sa couleur) reste secret */
  hideRole?: boolean;
}

/** Carte 3D : dos « ? » (face cachée) et face rôle. Le contenu secret n'est rendu que si la carte est retournée. */
export function RoleCard({
  role,
  word,
  flipped,
  name,
  kicker = 'Ton rôle',
  frontLabel = 'Touche pour retourner',
  onClick,
  hideRole = false,
}: RoleCardProps) {
  return (
    <div className="uc-flip" data-flipped={flipped} data-role={hideRole ? undefined : role} onClick={onClick}>
      <div className="uc-flip__card">
        <div className="uc-flip__face uc-flip__face--front" aria-hidden={flipped}>
          <span className="uc-flip__mark" aria-hidden="true">
            ?
          </span>
          <span className="uc-flip__hint">{frontLabel}</span>
        </div>
        <div className="uc-flip__face uc-flip__face--back" aria-hidden={!flipped}>
          {flipped && (
            <>
              <p className="uc-flip__kicker">{name ? `${name} était…` : kicker}</p>
              {!hideRole && <p className="uc-role">{ROLE_LABELS[role].toUpperCase()}</p>}
              {word ? (
                <>
                  <p className="uc-flip__kicker">Ton mot est :</p>
                  <p className="uc-word">{word.toUpperCase()}</p>
                </>
              ) : (
                !name && <p className="uc-flip__text">Tu n’as reçu aucun mot. Bonne chance.</p>
              )}
              {!name && !hideRole && <p className="uc-flip__tip">{ROLE_HINTS[role]}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ——— Interrupteur ————————————————————————————————————————————

interface ToggleProps {
  /** Nom de l'interrupteur, lu tel quel par les lecteurs d'écran (l'état est annoncé à part) */
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Texte visible selon l'état, ex. « Caché » / « Visible » */
  states?: [off: string, on: string];
  disabled?: boolean;
}

/** Interrupteur (`role="switch"`) : une case à cocher dont seule la forme est remplacée, comme les pastilles du lobby. */
export function Toggle({ label, checked, onChange, states, disabled }: ToggleProps) {
  return (
    <label className="uc-toggle" data-disabled={disabled || undefined}>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="uc-toggle__ui">
        <span className="uc-toggle__track" aria-hidden="true">
          <span className="uc-toggle__thumb" />
        </span>
        <span className="uc-toggle__label">{label}</span>
        {states && (
          <span className="uc-toggle__state" aria-hidden="true">
            {checked ? states[1] : states[0]}
          </span>
        )}
      </span>
    </label>
  );
}

// ——— Scores ——————————————————————————————————————————————————

export function Scoreboard({ players, roundScores }: { players: PublicPlayer[]; roundScores?: Record<string, number> }) {
  const ranked = [...players].filter((player) => !player.left).sort((a, b) => b.score - a.score);
  const top = ranked[0]?.score ?? 0;
  const hasRound = roundScores && Object.keys(roundScores).length > 0;

  return (
    <table className="uc-scores">
      <caption className="uc-scores__caption">Classement</caption>
      <thead>
        <tr>
          <th scope="col">Joueur</th>
          {hasRound && <th scope="col">Cette manche</th>}
          <th scope="col">Total</th>
        </tr>
      </thead>
      <tbody>
        {ranked.map((player) => (
          <tr key={player.id}>
            <th scope="row">
              {player.score > 0 && player.score === top && <span aria-label="En tête">👑 </span>}
              {player.name}
            </th>
            {hasRound && <td>+{roundScores[player.id] ?? 0}</td>}
            <td>{player.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ——— Confettis (victoire) ————————————————————————————————————————

const CONFETTI_COLORS = ['var(--tomato)', 'var(--sun)', 'var(--blue)', 'var(--mint)', 'var(--pink)'];

export function Confetti() {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || reduced) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        root.children,
        { y: -60, opacity: 1, rotation: 0 },
        {
          y: () => window.innerHeight + 80,
          x: () => gsap.utils.random(-120, 120),
          rotation: () => gsap.utils.random(-540, 540),
          duration: () => gsap.utils.random(2.2, 4),
          ease: 'power1.in',
          stagger: { each: 0.04 },
          onComplete: () => {
            root.style.display = 'none';
          },
        },
      );
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  if (reduced) return null;
  return (
    <div ref={ref} className="uc-confetti" aria-hidden="true">
      {Array.from({ length: 40 }, (_, i) => (
        <span
          key={i}
          style={{ left: `${(i * 29 + 7) % 100}%`, background: CONFETTI_COLORS[i % CONFETTI_COLORS.length] } as CSSProperties}
        />
      ))}
    </div>
  );
}

// ——— Aide host ——————————————————————————————————————————————

/** Bouton de secours du host : débloque une phase si un joueur traîne. */
export function HostForce({ view, act, label }: ScreenProps & { label: string }) {
  if (!view.me.isHost) return null;
  return (
    <div className="uc-force">
      <button type="button" className="uc-link-button" onClick={() => act({ type: 'force' })}>
        {label}
      </button>
    </div>
  );
}
