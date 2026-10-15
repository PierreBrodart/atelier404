'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/undercover/client';
import type { PublicRoomSummary } from '@/lib/undercover/types';
import { Button } from '../ui/Button';

/** Rafraîchissement de la liste (simple requête, seulement quand l'onglet est visible). */
const REFRESH_MS = 5000;

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`;

interface PublicRoomsProps {
  /** Entre dans la room (avec le prénom saisi plus haut) */
  onEnter: (code: string) => void;
  /** Code de la room en cours d'entrée, pour désactiver les boutons pendant la requête */
  busyCode: string | null;
}

/** Parties publiques en cours : celles qu'un host a rendues publiques depuis son lobby. */
export function PublicRooms({ onEnter, busyCode }: PublicRoomsProps) {
  const [rooms, setRooms] = useState<PublicRoomSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (document.hidden) return;
      const result = await api<{ rooms: PublicRoomSummary[] }>({ type: 'list' });
      if (!cancelled && result.ok) setRooms(result.rooms);
    };
    load();
    const timer = window.setInterval(load, REFRESH_MS);
    document.addEventListener('visibilitychange', load);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', load);
    };
  }, []);

  return (
    <section className="uc-rooms" aria-labelledby="uc-rooms-title">
      <div className="uc-rooms__head">
        <h2 id="uc-rooms-title" className="uc-rooms__title">
          Parties en cours
        </h2>
        {rooms && rooms.length > 0 && <span className="uc-count">{rooms.length}</span>}
      </div>

      {rooms === null && <p className="uc-hint">Chargement des parties…</p>}
      {rooms?.length === 0 && (
        <p className="uc-hint">
          Aucune partie publique pour l’instant. Crée la tienne, puis rends-la publique depuis le lobby pour qu’elle
          apparaisse ici.
        </p>
      )}

      {rooms && rooms.length > 0 && (
        <ul className="uc-rooms__list">
          {rooms.map((room) => {
            const lobby = room.phase === 'LOBBY';
            return (
              <li key={room.code} className="uc-card uc-room">
                <div className="uc-room__main">
                  <p className="uc-room__name">Partie de {room.hostName}</p>
                  <p className="uc-room__meta">
                    <span className="uc-room__code">{room.code}</span>
                    <span>{plural(room.players, 'joueur')}</span>
                    {room.spectators > 0 && <span>{plural(room.spectators, 'spectateur')}</span>}
                  </p>
                </div>
                <span className="uc-room__phase" data-lobby={lobby}>
                  {lobby ? 'Dans le lobby' : `Manche ${room.round} en cours`}
                </span>
                <Button onClick={() => onEnter(room.code)} disabled={busyCode !== null}>
                  {busyCode === room.code ? 'Connexion…' : lobby ? 'Rejoindre' : 'Regarder'}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
