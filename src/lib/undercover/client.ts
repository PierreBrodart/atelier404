'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { BASE_PATH } from '@/lib/basePath';
import type { ClientAction, JoinResponse, PeekResponse, RoomView } from './types';

/**
 * Côté navigateur : API + session + abonnement temps réel.
 * La session (identifiant + jeton du joueur) est gardée dans le localStorage pour survivre
 * à un rechargement de page : le joueur retrouve sa place, son rôle et son mot.
 */

const sessionKey = (code: string) => `a404:uc:session:${code}`;
export const NAME_KEY = 'a404:uc:name';
export const LAST_ROOM_KEY = 'a404:uc:last';

interface Session {
  playerId: string;
  token: string;
}

type ApiResult<T> = ({ ok: true } & T) | { ok: false; error: string; status: number };

export async function api<T = Record<string, never>>(body: Record<string, unknown>): Promise<ApiResult<T>> {
  try {
    // `fetch()` est écrit à la main : contrairement à next/link, `basePath` ne s'y applique
    // pas tout seul, il faut le préfixer explicitement (voir src/lib/basePath.ts).
    const response = await fetch(`${BASE_PATH}/api/undercover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as { ok: boolean; error?: string } & T;
    if (response.ok && data.ok) return data as { ok: true } & T;
    return { ok: false, error: data.error ?? 'Une erreur est survenue.', status: response.status };
  } catch {
    return { ok: false, error: 'Impossible de joindre le serveur. Vérifie ta connexion.', status: 0 };
  }
}

const safeStorage = {
  get: (key: string) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // stockage indisponible (navigation privée…) : le jeu fonctionne, sans reprise après rechargement
    }
  },
  remove: (key: string) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // idem
    }
  },
};

export const storage = safeStorage;

const noopSubscribe = () => () => {};

/**
 * Lit une valeur du navigateur (localStorage, URL…) sans setState dans un effet.
 * Rend `fallback` côté serveur et pendant l'hydratation, puis la vraie valeur.
 */
export function useBrowserValue(read: () => string, fallback = ''): string {
  return useSyncExternalStore(noopSubscribe, read, () => fallback);
}

export function saveSession(join: JoinResponse) {
  safeStorage.set(sessionKey(join.code), JSON.stringify({ playerId: join.playerId, token: join.token }));
  safeStorage.set(LAST_ROOM_KEY, join.code);
}

export function loadSession(code: string): Session | null {
  const raw = safeStorage.get(sessionKey(code));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Session>;
    return typeof parsed.playerId === 'string' && typeof parsed.token === 'string'
      ? { playerId: parsed.playerId, token: parsed.token }
      : null;
  } catch {
    return null;
  }
}

export function clearSession(code: string) {
  safeStorage.remove(sessionKey(code));
  if (safeStorage.get(LAST_ROOM_KEY) === code) safeStorage.remove(LAST_ROOM_KEY);
}

export type Connection = 'loading' | 'needsJoin' | 'connecting' | 'live' | 'reconnecting' | 'gone';

/** Se connecte à une room : flux temps réel, reprise de session, actions. */
export function useRoom(code: string) {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<RoomView | null>(null);
  const [connection, setConnection] = useState<Connection>('loading');
  const [peek, setPeek] = useState<PeekResponse | null>(null);
  const [attempt, setAttempt] = useState(0);
  const sessionRef = useRef<Session | null>(null);

  // 1) Reprise de session, ou consultation de la room pour proposer de la rejoindre
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = loadSession(code);
      if (stored) {
        sessionRef.current = stored;
        if (!cancelled) {
          setSession(stored);
          setConnection('connecting');
        }
        return;
      }
      const result = await api<PeekResponse>({ type: 'peek', code });
      if (cancelled) return;
      if (result.ok && result.exists) {
        setPeek(result);
        setConnection('needsJoin');
      } else {
        setConnection('gone');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, attempt]);

  // 2) Flux temps réel (Server-Sent Events). Le navigateur se reconnecte tout seul en cas de coupure.
  useEffect(() => {
    if (!session) return;
    const source = new EventSource(
      `${BASE_PATH}/api/undercover/stream?code=${encodeURIComponent(code)}&token=${encodeURIComponent(session.token)}`,
    );

    source.addEventListener('state', (event) => {
      setView(JSON.parse((event as MessageEvent<string>).data) as RoomView);
      setConnection('live');
    });
    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) {
        // Refus définitif du serveur (jeton invalide, room supprimée) : on repart de zéro.
        clearSession(code);
        sessionRef.current = null;
        setSession(null);
        setView(null);
        setAttempt((value) => value + 1);
      } else {
        setConnection('reconnecting');
      }
    };
    return () => source.close();
  }, [code, session]);

  const join = useCallback(
    async (name: string): Promise<string | null> => {
      const result = await api<JoinResponse>({ type: 'join', code, name });
      if (!result.ok) return result.error;
      saveSession(result);
      const next = { playerId: result.playerId, token: result.token };
      sessionRef.current = next;
      setConnection('connecting');
      setSession(next);
      return null;
    },
    [code],
  );

  /** Envoie une action. Retourne un message d'erreur (ou null si tout va bien). */
  const send = useCallback(
    async (action: ClientAction): Promise<string | null> => {
      const current = sessionRef.current;
      if (!current) return 'Tu n’es plus connecté à la room.';
      const result = await api({ type: 'action', code, token: current.token, action });
      if (result.ok) return null;
      if (result.status === 401) {
        clearSession(code);
        sessionRef.current = null;
        setSession(null);
        setView(null);
        setAttempt((value) => value + 1);
      }
      return result.error;
    },
    [code],
  );

  const leave = useCallback(async () => {
    await send({ type: 'leave' });
    clearSession(code);
    sessionRef.current = null;
    setSession(null);
    setView(null);
  }, [code, send]);

  return { connection, view, peek, join, send, leave };
}
