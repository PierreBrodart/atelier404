import { timingSafeEqual } from 'node:crypto';
import {
  activePlayers,
  addPlayer,
  applyAction,
  createPlayer,
  createRoom,
  findPlayer,
  generateCode,
  reconcile,
  removePlayer,
  transferHost,
} from './engine';
import { LIMITS, TIMING } from './rules';
import { toRoomView } from './view';
import type { ActionResult, ClientAction, JoinResponse, PeekResponse, Room, RoomView, ServerPlayer } from './types';

/**
 * Store des rooms + synchronisation temps réel (SSE).
 *
 * Choix technique : Server-Sent Events (flux serveur → client) + requêtes POST (client → serveur).
 * Aucune dépendance, aucun service externe. L'état vit en mémoire dans UN processus Node
 * (`next start`). Pour passer à plusieurs instances ou à du serverless, il suffit de remplacer
 * ce module par une implémentation adossée à Redis (+ pub/sub) : l'API exportée reste la même.
 *
 * Confidentialité : chaque abonné reçoit `toRoomView(room, sonId)` — jamais l'état complet.
 */

interface Subscriber {
  playerId: string;
  send: (view: RoomView) => void;
  close: () => void;
}

interface Store {
  rooms: Map<string, Room>;
  subscribers: Map<string, Set<Subscriber>>;
  timer: ReturnType<typeof setInterval> | null;
}

const MAX_ROOMS = 300;

// En développement, chaque route peut avoir sa propre copie de ce module : on ancre le store sur globalThis.
const holder = globalThis as typeof globalThis & { __atelier404Undercover?: Store };
const store: Store = (holder.__atelier404Undercover ??= { rooms: new Map(), subscribers: new Map(), timer: null });

// ——— Diffusion ———————————————————————————————————————————————

function broadcast(room: Room): void {
  const subscribers = store.subscribers.get(room.code);
  if (!subscribers) return;
  for (const subscriber of [...subscribers]) {
    try {
      subscriber.send(toRoomView(room, subscriber.playerId));
    } catch {
      subscribers.delete(subscriber);
    }
  }
}

function closePlayerStreams(room: Room, playerId: string): void {
  const subscribers = store.subscribers.get(room.code);
  if (!subscribers) return;
  for (const subscriber of [...subscribers]) {
    if (subscriber.playerId !== playerId) continue;
    subscribers.delete(subscriber);
    subscriber.close();
  }
}

function deleteRoom(code: string): void {
  const subscribers = store.subscribers.get(code);
  subscribers?.forEach((subscriber) => subscriber.close());
  store.subscribers.delete(code);
  store.rooms.delete(code);
}

// ——— Authentification ————————————————————————————————————————

function sameToken(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function authenticate(code: string, token: string): { room: Room; player: ServerPlayer } | null {
  const room = store.rooms.get(code);
  if (!room) return null;
  const player = room.players.find((candidate) => sameToken(candidate.token, token));
  return player && !player.left ? { room, player } : null;
}

const asJoin = (room: Room, player: ServerPlayer): JoinResponse => ({
  code: room.code,
  playerId: player.id,
  token: player.token,
});

// ——— API du store ————————————————————————————————————————————

export function createRoomForHost(name: string): JoinResponse | { error: string } {
  ensureMaintenance();
  if (store.rooms.size >= MAX_ROOMS) return { error: 'Trop de parties en cours, réessaie dans quelques minutes.' };
  const host = createPlayer(name);
  const room = createRoom(generateCode((code) => store.rooms.has(code)), host);
  store.rooms.set(room.code, room);
  return asJoin(room, host);
}

export function joinRoom(code: string, name: string): JoinResponse | { error: string; status: number } {
  ensureMaintenance();
  const room = store.rooms.get(code);
  if (!room) return { error: 'Cette room n’existe pas (ou elle a expiré).', status: 404 };
  const player = createPlayer(name);
  const result = addPlayer(room, player);
  if (!result.ok) return { error: result.error, status: 409 };
  broadcast(room);
  return asJoin(room, player);
}

export function peekRoom(code: string): PeekResponse {
  const room = store.rooms.get(code);
  if (!room) {
    return { exists: false, joinable: false, reason: 'Cette room n’existe pas (ou elle a expiré).', phase: null, playerCount: 0, max: LIMITS.maxPlayers };
  }
  const count = activePlayers(room).length;
  let reason: string | null = null;
  if (room.phase !== 'LOBBY') reason = 'La partie est déjà lancée. Reviens à la prochaine manche !';
  else if (count >= LIMITS.maxPlayers) reason = 'La room est pleine.';
  return { exists: true, joinable: reason === null, reason, phase: room.phase, playerCount: count, max: LIMITS.maxPlayers };
}

export function runAction(code: string, token: string, action: ClientAction): ActionResult | null {
  const auth = authenticate(code, token);
  if (!auth) return null;
  const { room, player } = auth;

  const result = applyAction(room, player.id, action);
  if (action.type === 'leave') closePlayerStreams(room, player.id);
  if (activePlayers(room).length === 0) {
    deleteRoom(room.code);
    return result;
  }
  if (result.ok) broadcast(room);
  return result;
}

/**
 * Abonne un joueur au flux temps réel de sa room. Retourne une fonction de désabonnement,
 * ou null si le jeton est invalide. La présence (connecté / absent) est gérée ici.
 */
export function subscribe(
  code: string,
  token: string,
  send: (view: RoomView) => void,
  close: () => void,
): (() => void) | null {
  ensureMaintenance();
  const auth = authenticate(code, token);
  if (!auth) return null;
  const { room, player } = auth;

  const subscriber: Subscriber = { playerId: player.id, send, close };
  let subscribers = store.subscribers.get(room.code);
  if (!subscribers) {
    subscribers = new Set();
    store.subscribers.set(room.code, subscribers);
  }
  subscribers.add(subscriber);

  player.connections += 1;
  player.disconnectedAt = null;
  player.away = false;
  room.updatedAt = Date.now();
  broadcast(room);

  return () => {
    const current = store.subscribers.get(room.code);
    if (!current?.delete(subscriber)) return;
    player.connections = Math.max(0, player.connections - 1);
    if (player.connections === 0 && !player.left) player.disconnectedAt = Date.now();
    room.updatedAt = Date.now();
    if (store.rooms.has(room.code)) broadcast(room);
  };
}

// ——— Maintenance : présence, transfert de host, nettoyage ————————————

function tick(): void {
  const now = Date.now();
  for (const room of [...store.rooms.values()]) {
    let changed = false;

    for (const player of [...room.players]) {
      if (player.left || player.connections > 0 || player.disconnectedAt === null) continue;
      const gone = now - player.disconnectedAt;
      if (room.phase === 'LOBBY' && gone > TIMING.lobbyDropAfterMs) {
        removePlayer(room, player.id);
        changed = true;
      } else if (!player.away && gone > TIMING.awayAfterMs) {
        player.away = true;
        changed = true;
      }
    }

    const host = findPlayer(room, room.hostId);
    const hostGone =
      !host || host.left || (host.connections === 0 && host.disconnectedAt !== null && now - host.disconnectedAt > TIMING.hostTransferAfterMs);
    if (hostGone && activePlayers(room).some((player) => player.connections > 0 && player.id !== room.hostId)) {
      transferHost(room);
      changed = true;
    }

    if (changed) {
      room.updatedAt = now;
      reconcile(room);
      if (activePlayers(room).length === 0) {
        deleteRoom(room.code);
        continue;
      }
      broadcast(room);
    }

    const nobodyConnected = !room.players.some((player) => player.connections > 0);
    if ((nobodyConnected && now - room.updatedAt > TIMING.emptyRoomTtlMs) || now - room.createdAt > TIMING.roomTtlMs) {
      deleteRoom(room.code);
    }
  }
}

function ensureMaintenance(): void {
  if (store.timer) return;
  store.timer = setInterval(tick, 5000);
  store.timer.unref?.();
}
