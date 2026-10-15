import { randomBytes, randomInt } from 'node:crypto';
import { getTheme, themes } from '@/data/undercover';
import { LIMITS, SKIP_VOTE, composition, normalizeComposition, normalizeWord } from './rules';
import { scoreRound } from './scoring';
import type {
  ActionResult,
  ClientAction,
  GameData,
  GamePhase,
  GameSettings,
  Outcome,
  Role,
  Room,
  ServerPlayer,
} from './types';

/**
 * Moteur du jeu : machine à états SANS entrées/sorties (pas de réseau, pas de timers).
 * Il modifie un `Room` en mémoire et retourne un résultat. La synchronisation
 * (SSE, présence) est dans `store.ts`, la projection publique/privée dans `view.ts`.
 *
 *  LOBBY → REVEAL → CLUES → VOTING → RESULT → ELIMINATION → (CLUES | GAME_OVER)
 *                              ↑         │ égalité
 *                              └─────────┘ (re-vote entre les ex æquo)
 *  GAME_OVER → LOBBY (nouvelle manche : la room, les joueurs et les scores sont conservés)
 */

const OK: ActionResult = { ok: true };
const fail = (error: string): ActionResult => ({ ok: false, error });

// ——— Utilitaires ————————————————————————————————————————————

export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const pick = <T>(items: readonly T[]): T => items[randomInt(items.length)];

export const newId = (bytes = 6) => randomBytes(bytes).toString('hex');

// Sans I, O, 0, 1 : évite les confusions à l'oral
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateCode(exists: (code: string) => boolean): string {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const code = Array.from({ length: 5 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
    if (!exists(code)) return code;
  }
  throw new Error('Impossible de générer un code de room');
}

export function createPlayer(name: string): ServerPlayer {
  return {
    id: newId(4),
    token: newId(16),
    name,
    joinedAt: Date.now(),
    seat: 'player',
    queuedAt: null,
    recentChats: [],
    connections: 0,
    disconnectedAt: null,
    away: false,
    left: false,
  };
}

export function createRoom(code: string, host: ServerPlayer): Room {
  const now = Date.now();
  return {
    code,
    hostId: host.id,
    players: [host],
    settings: { themeId: 'random', revealRoles: true, undercoverCount: 1, mrWhiteCount: 0 },
    phase: 'LOBBY',
    round: 1,
    turn: 0,
    revision: 0,
    scores: { [host.id]: 0 },
    game: null,
    isPublic: false,
    usedPairs: [],
    chat: [],
    chatSeq: 0,
    createdAt: now,
    updatedAt: now,
  };
}

// ——— Requêtes ————————————————————————————————————————————————

/** Toutes les personnes encore dans la room : joueurs ET spectateurs. */
export const activePlayers = (room: Room) => room.players.filter((player) => !player.left);
/** Les joueurs assis à la table (hors spectateurs). */
export const seatedPlayers = (room: Room) => activePlayers(room).filter((player) => player.seat === 'player');
export const isSpectator = (player: ServerPlayer) => player.seat !== 'player';
/** File d'attente, dans l'ordre d'arrivée. */
export const queuedPlayers = (room: Room) =>
  activePlayers(room)
    .filter((player) => player.seat === 'queue')
    .sort((a, b) => (a.queuedAt ?? 0) - (b.queuedAt ?? 0));
export const findPlayer = (room: Room, id: string) => room.players.find((player) => player.id === id);

/** Un joueur « absent » ne bloque pas la progression de la partie. */
const isAbsent = (room: Room, id: string) => {
  const player = findPlayer(room, id);
  return !player || player.left || player.away;
};

export const isPlaying = (phase: GamePhase) => phase !== 'LOBBY' && phase !== 'GAME_OVER';

function touch(room: Room, phase?: GamePhase) {
  if (phase) {
    room.phase = phase;
    room.revision += 1;
  }
  room.updatedAt = Date.now();
}

// ——— Lobby ———————————————————————————————————————————————————

/**
 * Remet les réglages dans un état valide pour le nombre de joueurs assis.
 * `keep` : réglage que le host vient de modifier, conservé si Undercover et Mr White ne tiennent pas ensemble.
 */
export function normalizeSettings(room: Room, keep?: 'undercover' | 'mrWhite'): void {
  const count = seatedPlayers(room).length;
  const { settings } = room;
  const themeId = settings.themeId === 'random' || getTheme(settings.themeId) ? settings.themeId : 'random';
  room.settings = {
    ...settings,
    themeId,
    ...normalizeComposition(settings.undercoverCount, settings.mrWhiteCount > 0, count, keep),
  };
}

/** En lobby, toute la file d'attente prend place à la table (il n'y a pas de nombre maximum de joueurs). */
function fillSeats(room: Room): void {
  if (room.phase !== 'LOBBY') return;
  for (const player of queuedPlayers(room)) {
    player.seat = 'player';
    player.queuedAt = null;
  }
}

/**
 * Nouvelle arrivée : assise à la table en lobby, spectatrice en file d'attente si une manche est en
 * cours — elle jouera dès la manche suivante. Aucune limite de joueurs ni de spectateurs.
 */
export function addPlayer(room: Room, player: ServerPlayer): ActionResult {
  const taken = activePlayers(room).some((other) => other.name.toLowerCase() === player.name.toLowerCase());
  if (taken) return fail('Ce prénom est déjà pris dans la room.');

  const seated = room.phase === 'LOBBY';
  player.seat = seated ? 'player' : 'queue';
  player.queuedAt = seated ? null : Date.now();

  room.players.push(player);
  room.scores[player.id] = 0;
  normalizeSettings(room);
  touch(room);
  return OK;
}

/** Donne le rôle de host à quelqu'un d'autre : un joueur connecté d'abord, puis un spectateur connecté. */
export function transferHost(room: Room): void {
  const candidates = activePlayers(room).filter((player) => player.id !== room.hostId);
  const next =
    candidates.find((player) => player.connections > 0 && !isSpectator(player)) ??
    candidates.find((player) => player.connections > 0) ??
    candidates.find((player) => !isSpectator(player)) ??
    candidates[0];
  if (next) room.hostId = next.id;
}

/** Quelqu'un quitte (volontairement ou parce qu'il est resté déconnecté trop longtemps). */
export function removePlayer(room: Room, playerId: string): void {
  const player = findPlayer(room, playerId);
  if (!player || player.left) return;
  const wasHost = room.hostId === playerId;

  // En lobby, ou pour un spectateur (qui n'a aucune donnée de manche) : on l'efface simplement.
  if (room.phase === 'LOBBY' || isSpectator(player)) {
    room.players = room.players.filter((other) => other.id !== playerId);
    delete room.scores[playerId];
  } else {
    player.left = true;
    if (isPlaying(room.phase) && room.game?.alive.includes(playerId)) eliminateDeparture(room, playerId);
  }

  if (wasHost) transferHost(room);
  if (room.phase === 'LOBBY') {
    fillSeats(room);
    normalizeSettings(room);
  }
  touch(room);
  reconcile(room);
}

function updateSettings(room: Room, settings: Partial<GameSettings>): ActionResult {
  room.settings = { ...room.settings, ...settings };
  normalizeSettings(room, settings.undercoverCount !== undefined ? 'undercover' : 'mrWhite');
  touch(room);
  return OK;
}

/**
 * Jouer ou regarder. Un spectateur qui veut jouer entre dans la file (assis tout de suite en lobby
 * s'il reste une place). Un joueur ne peut passer spectateur qu'en lobby : en pleine manche, il a un rôle.
 */
function changeSeat(room: Room, player: ServerPlayer, play: boolean): ActionResult {
  if (play) {
    if (player.seat === 'player') return OK;
    if (player.seat === 'watch') {
      player.seat = 'queue';
      player.queuedAt = Date.now();
    }
    fillSeats(room);
  } else {
    if (player.seat === 'watch') return OK;
    if (player.seat === 'player' && room.phase !== 'LOBBY') {
      return fail('Tu joues cette manche : tu pourras passer spectateur au retour dans le lobby.');
    }
    player.seat = 'watch';
    player.queuedAt = null;
    fillSeats(room);
  }
  if (room.phase === 'LOBBY') normalizeSettings(room);
  touch(room);
  return OK;
}

// ——— Administration de la room ————————————————————————————————————

function setVisibility(room: Room, player: ServerPlayer, isPublic: boolean): ActionResult {
  if (room.hostId !== player.id) return fail('Seul le host peut rendre la partie publique ou privée.');
  room.isPublic = isPublic;
  touch(room);
  return OK;
}

/** Changer de prénom, à tout moment. Les anciens messages du chat gardent le prénom d'alors. */
function rename(room: Room, player: ServerPlayer, name: string): ActionResult {
  const taken = activePlayers(room).some(
    (other) => other.id !== player.id && other.name.toLowerCase() === name.toLowerCase(),
  );
  if (taken) return fail('Ce prénom est déjà pris dans la room.');
  player.name = name;
  touch(room);
  return OK;
}

/** Le host passe la main à quelqu'un d'autre de la room (joueur ou spectateur). */
function giveLead(room: Room, player: ServerPlayer, targetId: string): ActionResult {
  if (room.hostId !== player.id) return fail('Seul le host peut passer le lead.');
  const target = findPlayer(room, targetId);
  if (!target || target.left || target.id === player.id) return fail('Cette personne ne peut pas recevoir le lead.');
  room.hostId = target.id;
  touch(room);
  return OK;
}

// ——— Chat ————————————————————————————————————————————————————

function postChat(room: Room, player: ServerPlayer, text: string): ActionResult {
  const now = Date.now();
  player.recentChats = player.recentChats.filter((at) => now - at < LIMITS.chatWindowMs);
  if (player.recentChats.length >= LIMITS.chatBurst) return fail('Doucement : attends un peu avant le prochain message.');
  player.recentChats.push(now);

  room.chatSeq += 1;
  room.chat.push({
    id: room.chatSeq,
    playerId: player.id,
    name: player.name,
    text,
    // Pendant une manche, un éliminé ou un spectateur ne parle qu'aux autres éliminés et spectateurs.
    ghost: isPlaying(room.phase) && !room.game?.alive.includes(player.id),
  });
  if (room.chat.length > LIMITS.chatHistory) room.chat.splice(0, room.chat.length - LIMITS.chatHistory);
  touch(room);
  return OK;
}

// ——— Démarrage d'une manche ————————————————————————————————————

function pickPair(room: Room): { civilianWord: string; undercoverWord: string; themeLabel: string } {
  const theme = room.settings.themeId === 'random' ? pick(themes) : (getTheme(room.settings.themeId) ?? pick(themes));
  const prefix = `${theme.id}:`;
  let indexes = theme.pairs.map((_, index) => index).filter((index) => !room.usedPairs.includes(`${prefix}${index}`));
  if (indexes.length === 0) {
    // Toutes les paires du thème ont été jouées : on repart de zéro pour ce thème
    room.usedPairs = room.usedPairs.filter((key) => !key.startsWith(prefix));
    indexes = theme.pairs.map((_, index) => index);
  }
  const index = pick(indexes);
  room.usedPairs.push(`${prefix}${index}`);
  const pair = theme.pairs[index];
  // Le mot « civil » est tiré au sort dans la paire : aucun biais d'orientation
  const swap = randomInt(2) === 1;
  return {
    civilianWord: swap ? pair.undercover : pair.civilian,
    undercoverWord: swap ? pair.civilian : pair.undercover,
    themeLabel: theme.label,
  };
}

function startGame(room: Room, playerId: string): ActionResult {
  if (room.hostId !== playerId) return fail('Seul le host peut lancer la partie.');
  if (room.phase !== 'LOBBY') return fail('La partie est déjà lancée.');

  const players = seatedPlayers(room);
  if (players.length < LIMITS.minPlayers) return fail(`Il faut au moins ${LIMITS.minPlayers} joueurs.`);
  normalizeSettings(room);
  const { undercoverCount, mrWhiteCount } = room.settings;
  if (!composition(players.length, undercoverCount, mrWhiteCount).valid) return fail('Composition incohérente.');

  const pair = pickPair(room);
  const order = shuffle(players.map((player) => player.id));
  const assignments: GameData['assignments'] = {};
  order.forEach((id, index) => {
    let role: Role = 'CIVIL';
    if (index < undercoverCount) role = 'UNDERCOVER';
    else if (index < undercoverCount + mrWhiteCount) role = 'MR_WHITE';
    assignments[id] = {
      role,
      word: role === 'CIVIL' ? pair.civilianWord : role === 'UNDERCOVER' ? pair.undercoverWord : null,
    };
  });

  room.game = {
    themeLabel: pair.themeLabel,
    civilianWord: pair.civilianWord,
    undercoverWord: pair.undercoverWord,
    assignments,
    alive: players.map((player) => player.id),
    eliminated: [],
    clueOrder: [],
    clues: {},
    clueHistory: [],
    ready: [],
    votes: [],
    voteCandidates: null,
    voteRound: 1,
    voteResult: null,
    eliminationId: null,
    pendingGuess: null,
    guess: null,
    stalledTurns: 0,
    outcome: null,
    roundScores: {},
  };
  room.turn = 1;
  touch(room, 'REVEAL');
  return OK;
}

function newRound(room: Room, playerId: string): ActionResult {
  if (room.hostId !== playerId) return fail('Seul le host peut lancer une nouvelle manche.');
  if (room.phase !== 'GAME_OVER') return fail('La manche n’est pas terminée.');
  room.players = room.players.filter((player) => !player.left);
  room.game = null;
  room.round += 1;
  room.turn = 0;
  touch(room, 'LOBBY');
  // Retour au lobby : la file d'attente prend les places libres (dans l'ordre d'arrivée).
  fillSeats(room);
  normalizeSettings(room);
  return OK;
}

// ——— Phases de jeu —————————————————————————————————————————————

/**
 * Ordre de passage tiré au sort, avec une règle : Mr White n'ouvre jamais le tour (sans mot, il n'aurait
 * aucun indice à écouter avant de parler). Le premier est tiré parmi les autres joueurs — de préférence
 * présents, car un absent est passé automatiquement et Mr White se retrouverait alors à parler en premier.
 */
function drawClueOrder(room: Room, game: GameData): string[] {
  const order = shuffle(game.alive);
  const notWhite = order.filter((id) => game.assignments[id]?.role !== 'MR_WHITE');
  const present = notWhite.filter((id) => !isAbsent(room, id));
  const pool = present.length > 0 ? present : notWhite;
  if (pool.length === 0) return order;
  const first = pick(pool);
  return [first, ...order.filter((id) => id !== first)];
}

function beginClues(room: Room) {
  const game = room.game;
  if (!game) return;
  game.clues = {};
  game.ready = [];
  game.clueOrder = drawClueOrder(room, game);
  touch(room, 'CLUES');
}

export function currentSpeaker(room: Room): string | null {
  const game = room.game;
  if (!game || room.phase !== 'CLUES') return null;
  return game.clueOrder.find((id) => game.alive.includes(id) && !game.clues[id]) ?? null;
}

function beginVoting(room: Room, candidates: string[] | null, round: number) {
  const game = room.game;
  if (!game) return;
  game.votes = [];
  game.voteCandidates = candidates;
  game.voteRound = round;
  touch(room, 'VOTING');
}

function resolveVotes(room: Room) {
  const game = room.game;
  if (!game) return;

  const tallies: Record<string, number> = {};
  for (const ballot of game.votes) tallies[ballot.targetId] = (tallies[ballot.targetId] ?? 0) + 1;
  const max = Math.max(0, ...Object.values(tallies));
  const top = Object.keys(tallies).filter((id) => tallies[id] === max);

  let outcome: 'eliminated' | 'tie' | 'noElimination' = 'noElimination';
  let eliminatedId: string | null = null;
  let tiedIds: string[] = [];
  if (max > 0 && top.length === 1 && top[0] !== SKIP_VOTE) {
    outcome = 'eliminated';
    eliminatedId = top[0];
  } else if (max > 0 && top.length > 1 && game.voteRound < LIMITS.maxVoteRounds) {
    // Égalité entre plusieurs cibles (« Passer » y compris) : re-vote entre les ex æquo.
    // « Passer » reste de toute façon toujours proposable au tour suivant (voir Voting.tsx).
    outcome = 'tie';
    tiedIds = top.filter((id) => id !== SKIP_VOTE);
  }

  game.voteResult = { round: game.voteRound, ballots: [...game.votes], tallies, outcome, eliminatedId, tiedIds };
  touch(room, 'RESULT');
}

/** Retire un joueur de la partie. Retourne false s'il n'était plus en vie. */
function eliminate(room: Room, playerId: string, reason: 'vote' | 'left'): boolean {
  const game = room.game;
  if (!game || !game.alive.includes(playerId)) return false;
  game.alive = game.alive.filter((id) => id !== playerId);
  game.eliminated.push({ playerId, role: game.assignments[playerId].role, turn: room.turn, reason });
  game.votes = game.votes.filter((vote) => vote.voterId !== playerId && vote.targetId !== playerId);
  game.ready = game.ready.filter((id) => id !== playerId);
  return true;
}

/** Départ d'un joueur en cours de partie : élimination sans vote, puis vérification de victoire. */
function eliminateDeparture(room: Room, playerId: string) {
  const game = room.game;
  if (!game) return;
  eliminate(room, playerId, 'left');
  if (game.pendingGuess === playerId) game.pendingGuess = null;
  if (game.voteCandidates) {
    game.voteCandidates = game.voteCandidates.filter((id) => id !== playerId);
    if (game.voteCandidates.length < 2) game.voteCandidates = null;
  }
  const outcome = checkVictory(room);
  if (outcome) finish(room, outcome);
}

function newTurn(room: Room) {
  const game = room.game;
  // Archive les indices du tour qui se termine (beginClues() vide `clues` juste après) : déjà
  // publics au moment où ils ont été donnés, on les garde pour la discussion du tour suivant.
  if (game) {
    for (const [playerId, clue] of Object.entries(game.clues)) {
      game.clueHistory.push({ turn: room.turn, playerId, text: clue.text, skipped: clue.skipped });
    }
  }
  room.turn += 1;
  beginClues(room);
}

function finish(room: Room, outcome: Outcome) {
  const game = room.game;
  if (!game) return;
  game.outcome = outcome;
  game.roundScores = scoreRound(outcome, game.assignments, game.alive);
  for (const [id, points] of Object.entries(game.roundScores)) room.scores[id] = (room.scores[id] ?? 0) + points;
  touch(room, 'GAME_OVER');
}

// ——— Victoire ———————————————————————————————————————————————

const idsWithRole = (game: GameData, role: Role, aliveOnly: boolean) =>
  Object.entries(game.assignments)
    .filter(([id, assignment]) => assignment.role === role && (!aliveOnly || game.alive.includes(id)))
    .map(([id]) => id);

/**
 * Victoire des imposteurs (parité, ou tours sans élimination). S'il reste un Undercover, tout le camp des
 * imposteurs gagne, éliminés compris (ils marquent moins, voir scoring.ts) ; sinon Mr White gagne seul.
 */
function impostorOutcome(game: GameData, reason: string): Outcome {
  if (idsWithRole(game, 'UNDERCOVER', true).length > 0) {
    const team = [...idsWithRole(game, 'UNDERCOVER', false), ...idsWithRole(game, 'MR_WHITE', false)];
    return { winner: 'UNDERCOVER', winnerIds: team, reason, byGuess: false };
  }
  const whites = idsWithRole(game, 'MR_WHITE', true);
  return {
    winner: 'MR_WHITE',
    winnerIds: whites,
    reason: 'Mr White a survécu jusqu’au bout sans connaître le mot : bluff parfait.',
    byGuess: false,
  };
}

/** Retourne la victoire s'il y en a une, sinon null. */
export function checkVictory(room: Room): Outcome | null {
  const game = room.game;
  if (!game) return null;

  const aliveCivilians = idsWithRole(game, 'CIVIL', true).length;
  const aliveImpostors = idsWithRole(game, 'UNDERCOVER', true).length + idsWithRole(game, 'MR_WHITE', true).length;

  if (aliveImpostors === 0) {
    return {
      winner: 'CIVILS',
      winnerIds: idsWithRole(game, 'CIVIL', false),
      reason: 'Tous les imposteurs ont été démasqués : les Civils ont eu du flair.',
      byGuess: false,
    };
  }
  if (aliveCivilians <= aliveImpostors) {
    return impostorOutcome(
      game,
      'Il ne reste plus assez de Civils pour les départager : les Undercover ont infiltré la partie.',
    );
  }
  return null;
}

// ——— Actions ————————————————————————————————————————————————

function applyGuess(room: Room, playerId: string, word: string): ActionResult {
  const game = room.game;
  if (!game || room.phase !== 'ELIMINATION' || game.pendingGuess !== playerId || game.guess) {
    return fail('Tu ne peux pas deviner le mot maintenant.');
  }
  const correct = normalizeWord(word) === normalizeWord(game.civilianWord);
  game.guess = { playerId, word, correct };

  if (correct) {
    finish(room, {
      winner: 'MR_WHITE',
      winnerIds: [playerId],
      reason: `Mr White a deviné le mot des Civils : « ${game.civilianWord} » !`,
      byGuess: true,
    });
  } else {
    touch(room);
  }
  return OK;
}

function afterElimination(room: Room) {
  const outcome = checkVictory(room);
  if (outcome) finish(room, outcome);
  else newTurn(room);
}

function next(room: Room, playerId: string): ActionResult {
  const game = room.game;
  if (!game) return fail('Aucune partie en cours.');
  if (room.hostId !== playerId) return fail('Seul le host peut continuer.');

  if (room.phase === 'RESULT') {
    const result = game.voteResult;
    if (!result) return fail('Résultat indisponible.');
    if (result.outcome === 'tie') {
      beginVoting(room, result.tiedIds, result.round + 1);
    } else if (result.outcome === 'noElimination') {
      game.stalledTurns += 1;
      if (game.stalledTurns >= LIMITS.maxStalledTurns) {
        finish(room, impostorOutcome(game, 'Trois tours sans élimination : les imposteurs gagnent la partie à l’usure.'));
      } else {
        newTurn(room);
      }
    } else if (result.eliminatedId) {
      game.stalledTurns = 0;
      game.eliminationId = result.eliminatedId;
      const wasAlive = eliminate(room, result.eliminatedId, 'vote');
      const role = game.assignments[result.eliminatedId].role;
      game.pendingGuess = wasAlive && role === 'MR_WHITE' ? result.eliminatedId : null;
      game.guess = null;
      touch(room, 'ELIMINATION');
    }
    return OK;
  }

  if (room.phase === 'ELIMINATION') {
    if (game.pendingGuess && !game.guess) return fail('Mr White doit d’abord tenter de deviner le mot.');
    afterElimination(room);
    return OK;
  }
  return fail('Rien à continuer pour l’instant.');
}

function force(room: Room, playerId: string): ActionResult {
  const game = room.game;
  if (!game) return fail('Aucune partie en cours.');
  if (room.hostId !== playerId) return fail('Seul le host peut forcer la suite.');

  switch (room.phase) {
    case 'REVEAL':
      game.ready = [...game.alive];
      break;
    case 'CLUES': {
      const speaker = currentSpeaker(room);
      if (speaker) game.clues[speaker] = { text: '', skipped: true };
      break;
    }
    case 'VOTING':
      resolveVotes(room);
      break;
    case 'ELIMINATION':
      if (game.pendingGuess && !game.guess) game.guess = { playerId: game.pendingGuess, word: '', correct: false };
      break;
    default:
      return fail('Rien à forcer pour l’instant.');
  }
  touch(room);
  reconcile(room);
  return OK;
}

/** Point d'entrée unique des actions des joueurs. */
export function applyAction(room: Room, playerId: string, action: ClientAction): ActionResult {
  const player = findPlayer(room, playerId);
  if (!player || player.left) return fail('Tu ne fais plus partie de cette room.');
  const game = room.game;
  const alive = Boolean(game?.alive.includes(playerId));

  let result: ActionResult = OK;

  switch (action.type) {
    case 'updateSettings':
      if (room.hostId !== playerId) return fail('Seul le host peut changer la configuration.');
      if (room.phase !== 'LOBBY') return fail('La configuration est verrouillée pendant la manche.');
      return updateSettings(room, action.settings);

    case 'startGame':
      result = startGame(room, playerId);
      break;

    case 'newRound':
      return newRound(room, playerId);

    case 'leave':
      removePlayer(room, playerId);
      return OK;

    case 'seat':
      return changeSeat(room, player, action.play);

    case 'visibility':
      return setVisibility(room, player, action.public);

    case 'rename':
      return rename(room, player, action.name);

    case 'giveLead':
      return giveLead(room, player, action.targetId);

    case 'chat':
      return postChat(room, player, action.text);

    case 'ready': {
      if (!game || room.phase !== 'REVEAL') return fail('Rien à valider maintenant.');
      if (!alive) return fail('Tu es éliminé : tu observes.');
      if (!game.ready.includes(playerId)) game.ready.push(playerId);
      touch(room);
      break;
    }

    case 'submitClue': {
      if (!game || room.phase !== 'CLUES') return fail('Ce n’est pas le moment des indices.');
      if (currentSpeaker(room) !== playerId) return fail('Ce n’est pas ton tour de donner un indice.');
      // L'indice se donne par écrit, toujours : il apparaît ainsi pour tous, spectateurs compris.
      if (!action.text) return fail('Écris ton indice avant de valider.');
      game.clues[playerId] = { text: action.text, skipped: false };
      touch(room);
      break;
    }

    case 'startVote': {
      if (!game || room.phase !== 'CLUES') return fail('Ce n’est pas le moment de lancer le vote.');
      if (room.hostId !== playerId) return fail('Seul le host peut lancer le vote.');
      if (currentSpeaker(room)) return fail('Tout le monde n’a pas encore donné son indice.');
      beginVoting(room, null, 1);
      break;
    }

    case 'vote': {
      if (!game || room.phase !== 'VOTING') return fail('Ce n’est pas le moment de voter.');
      if (!alive) return fail('Tu es éliminé : tu ne votes plus.');
      if (game.votes.some((vote) => vote.voterId === playerId)) return fail('Ton vote est déjà enregistré.');
      if (action.targetId !== SKIP_VOTE) {
        if (action.targetId === playerId) return fail('Tu ne peux pas voter pour toi-même.');
        const eligible = game.voteCandidates ?? game.alive;
        if (!eligible.includes(action.targetId) || !game.alive.includes(action.targetId)) {
          return fail('Ce joueur n’est pas éligible.');
        }
      }
      game.votes.push({ voterId: playerId, targetId: action.targetId });
      touch(room);
      break;
    }

    case 'guess':
      result = applyGuess(room, playerId, action.word);
      break;

    case 'next':
      result = next(room, playerId);
      break;

    case 'force':
      return force(room, playerId);
  }

  if (result.ok) reconcile(room);
  return result;
}

// ——— Progression automatique ————————————————————————————————————

const hasPresentPlayer = (room: Room) => room.game?.alive.some((id) => !isAbsent(room, id)) ?? false;

function step(room: Room): boolean {
  const game = room.game;
  if (!game) return false;

  switch (room.phase) {
    case 'REVEAL': {
      const waiting = game.alive.filter((id) => !game.ready.includes(id) && !isAbsent(room, id));
      if (waiting.length === 0 && hasPresentPlayer(room)) {
        beginClues(room);
        return true;
      }
      return false;
    }
    case 'CLUES': {
      const speaker = currentSpeaker(room);
      // Une fois tout le monde passé, on n'enchaîne plus tout seul sur le vote : le host
      // décide du moment (action `startVote`) — la discussion peut continuer avant.
      if (!speaker) return false;
      if (isAbsent(room, speaker)) {
        game.clues[speaker] = { text: '', skipped: true };
        return true;
      }
      return false;
    }
    case 'VOTING': {
      const eligibleIds = game.alive;
      const waiting = eligibleIds.filter(
        (id) => !game.votes.some((vote) => vote.voterId === id) && !isAbsent(room, id),
      );
      if (waiting.length === 0 && hasPresentPlayer(room)) {
        resolveVotes(room);
        return true;
      }
      return false;
    }
    case 'ELIMINATION': {
      if (game.pendingGuess && !game.guess && isAbsent(room, game.pendingGuess)) {
        game.guess = { playerId: game.pendingGuess, word: '', correct: false };
        touch(room);
        return true;
      }
      return false;
    }
    default:
      return false;
  }
}

/**
 * Fait avancer la partie tant que la phase courante est « complète »
 * (tous les joueurs présents ont agi). Appelée après chaque action et chaque
 * changement de présence, pour que la room ne reste jamais bloquée.
 */
export function reconcile(room: Room): void {
  for (let guard = 0; guard < 16; guard += 1) {
    if (!step(room)) return;
  }
}
