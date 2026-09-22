'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ROLE_LABELS } from '@/lib/undercover/rules';
import { useRoom } from '@/lib/undercover/client';
import type { ClientAction, RoomView, ThemeInfo } from '@/lib/undercover/types';
import { TLink } from '../layout/PageTransition';
import { ButtonLink } from '../ui/Button';
import { Clues } from './Clues';
import { Discussion } from './Discussion';
import { Elimination } from './Elimination';
import { GameOver, WINNER_TITLES } from './GameOver';
import { JoinGate } from './JoinGate';
import { Lobby } from './Lobby';
import { RoleReveal } from './RoleReveal';
import { VoteResult } from './VoteResult';
import { Voting } from './Voting';
import { useEnter } from './useEnter';

/** Phrase lue par les lecteurs d'écran à chaque changement de phase. */
function announcement(view: RoomView): string {
  const { room, me } = view;
  const nameOf = (id: string | null) => room.players.find((player) => player.id === id)?.name ?? '';

  switch (room.phase) {
    case 'LOBBY':
      return `Lobby, manche ${room.round}. ${room.players.filter((p) => !p.left).length} joueurs présents.`;
    case 'REVEAL':
      return 'La partie commence. Retourne ta carte en secret pour découvrir ton rôle.';
    case 'CLUES':
      return room.currentSpeakerId === me.playerId
        ? 'C’est à toi de donner ton indice.'
        : `${nameOf(room.currentSpeakerId)} donne son indice.`;
    case 'DISCUSSION':
      return 'Discussion : débattez, puis passez au vote.';
    case 'VOTING':
      return room.voting && room.voting.round > 1 ? 'Égalité. Nouveau vote entre les joueurs à égalité.' : 'Phase de vote.';
    case 'RESULT':
      return room.voteResult?.outcome === 'tie'
        ? 'Égalité au vote.'
        : room.voteResult?.eliminatedId
          ? `Le vote désigne ${nameOf(room.voteResult.eliminatedId)}.`
          : 'Aucune élimination ce tour-ci.';
    case 'ELIMINATION':
      return room.elimination
        ? `${nameOf(room.elimination.playerId)} est éliminé. C’était ${ROLE_LABELS[room.elimination.role]}.`
        : 'Élimination.';
    case 'GAME_OVER':
      return room.outcome ? `${WINNER_TITLES[room.outcome.winner]} ${room.outcome.reason}` : 'Fin de la manche.';
  }
}

/** « Mon mot » : rappel privé accessible pendant tout le tour (jamais visible des autres). */
function MyWord({ view }: { view: RoomView }) {
  const [shown, setShown] = useState(false);
  const { room, me } = view;
  if (!me.role) return null;
  const hideRole = !room.settings.revealRoles;

  return (
    <div className="uc-myword">
      <button type="button" className="uc-link-button" aria-pressed={shown} onClick={() => setShown((value) => !value)}>
        {shown ? 'Masquer mon mot' : 'Voir mon mot'}
      </button>
      {shown && (
        <p className="uc-myword__value" role="status">
          {me.word ? (
            hideRole ? (
              <strong>{me.word}</strong>
            ) : (
              <>
                {ROLE_LABELS[me.role]} : <strong>{me.word}</strong>
              </>
            )
          ) : (
            <>Mr White : pas de mot</>
          )}
        </p>
      )}
    </div>
  );
}

function PhaseScreen({ view, act, themes }: { view: RoomView; act: (action: ClientAction) => Promise<void>; themes: ThemeInfo[] }) {
  switch (view.room.phase) {
    case 'LOBBY':
      return <Lobby view={view} act={act} themes={themes} />;
    case 'REVEAL':
      return <RoleReveal view={view} act={act} />;
    case 'CLUES':
      return <Clues view={view} act={act} />;
    case 'DISCUSSION':
      return <Discussion view={view} act={act} />;
    case 'VOTING':
      return <Voting key={view.room.voting?.round ?? 1} view={view} act={act} />;
    case 'RESULT':
      return <VoteResult view={view} act={act} />;
    case 'ELIMINATION':
      return <Elimination view={view} act={act} />;
    case 'GAME_OVER':
      return <GameOver view={view} act={act} />;
  }
}

/** Une partie : reprise de session, flux temps réel, écran de la phase courante. */
export function RoomClient({ code, themes }: { code: string; themes: ThemeInfo[] }) {
  const router = useRouter();
  const { connection, view, peek, join, send, leave } = useRoom(code);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const lastScreen = useRef<string | null>(null);

  const act = useCallback(
    async (action: ClientAction) => {
      const error = await send(action);
      if (error) setToast(error);
    },
    [send],
  );

  const screenKey = view ? `${view.room.phase}-${view.room.turn}-${view.room.voting?.round ?? 0}` : 'none';
  const stageRef = useEnter<HTMLDivElement>(screenKey);

  // Changement d'écran (phase, tour, re-vote) : on remonte en haut et on place le focus sur le titre
  // (clavier, lecteurs d'écran). Rien ne se passe au premier affichage.
  useEffect(() => {
    if (screenKey !== 'none' && lastScreen.current && lastScreen.current !== screenKey) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.getElementById('uc-phase-title')?.focus({ preventScroll: true });
    }
    lastScreen.current = screenKey === 'none' ? null : screenKey;
  }, [screenKey]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (connection === 'loading' || (connection === 'connecting' && !view)) {
    return (
      <section className="uc" data-phase="LOBBY">
        <div className="uc__inner container">
          <p className="uc-waiting" role="status">
            <span className="uc-dots" aria-hidden="true" /> Connexion à la room {code}…
          </p>
        </div>
      </section>
    );
  }

  if (connection === 'gone') {
    return (
      <section className="uc" data-phase="RESULT">
        <div className="uc__inner container uc__gone">
          <h1 className="uc-head__title">Room introuvable.</h1>
          <p>Le code {code} n’existe pas ou la room a expiré (le serveur a peut-être redémarré).</p>
          <ButtonLink href="/undercover">Créer une nouvelle partie</ButtonLink>
        </div>
      </section>
    );
  }

  if (connection === 'needsJoin' || !view) {
    return <JoinGate code={code} peek={peek} join={join} />;
  }

  const { room } = view;
  const winner = room.outcome?.winner;

  return (
    <section className="uc" data-phase={room.phase} data-outcome={winner}>
      <div className="uc__inner container">
        <header className="uc__top">
          <h1 className="uc__brand">
            <TLink href="/undercover">Undercover</TLink>
          </h1>
          <p className="uc__code">
            <span className="sr-only">Code de la room : </span>
            {room.code}
          </p>
          {connection === 'reconnecting' && (
            <p className="uc__status" role="status">
              Connexion perdue… reconnexion
            </p>
          )}
          <MyWord view={view} />
          <div className="uc__leave">
            {confirmLeave ? (
              <>
                <button
                  type="button"
                  className="uc-link-button"
                  onClick={async () => {
                    await leave();
                    router.push('/undercover');
                  }}
                >
                  Oui, quitter
                </button>
                <button type="button" className="uc-link-button" onClick={() => setConfirmLeave(false)}>
                  Rester
                </button>
              </>
            ) : (
              <button type="button" className="uc-link-button" onClick={() => setConfirmLeave(true)}>
                Quitter la partie
              </button>
            )}
          </div>
        </header>

        <div ref={stageRef} className="uc__stage">
          <PhaseScreen view={view} act={act} themes={themes} />
        </div>
      </div>

      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement(view)}
      </div>
      {toast && (
        <p className="uc-toast" role="alert">
          {toast}
        </p>
      )}
    </section>
  );
}
