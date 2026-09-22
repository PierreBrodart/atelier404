/**
 * Types du mini-jeu Undercover.
 *
 * Trois familles, volontairement séparées :
 *  1. types partagés (rôles, phases, réglages, actions client) ;
 *  2. types SERVEUR uniquement (Room, GameData : contiennent les rôles et les mots) ;
 *  3. types PUBLICS / PRIVÉS envoyés aux clients (RoomView) : ils ne contiennent jamais
 *     d'information secrète appartenant à quelqu'un d'autre.
 */

// ——— 1. Partagé ———————————————————————————————————————————————

export type Role = 'CIVIL' | 'UNDERCOVER' | 'MR_WHITE';

export type GamePhase =
  | 'LOBBY'
  | 'REVEAL'
  | 'CLUES'
  | 'VOTING'
  | 'RESULT'
  | 'ELIMINATION'
  | 'GAME_OVER';

export type ThemeId = string;
export type ThemeChoice = ThemeId | 'random';

/** Thème de mots. Les paires ne quittent jamais le serveur. */
export interface Theme {
  id: ThemeId;
  label: string;
  icon: string;
  pairs: WordPair[];
}

/** Informations de thème envoyées au client (sans les mots). */
export interface ThemeInfo {
  id: ThemeId;
  label: string;
  icon: string;
  pairCount: number;
}

export interface WordPair {
  civilian: string;
  undercover: string;
  theme: string;
}

export interface GameSettings {
  themeId: ThemeChoice;
  /** Toujours 1 : il y a exactement un Undercover, ce n'est pas configurable. */
  undercoverCount: number;
  /** 0 ou 1 : Mr White est une option, pas un compteur. Peut coexister avec l'Undercover. */
  mrWhiteCount: number;
  /** Si false, les joueurs ne voient ni leur rôle ni leur mot avant la fin de la manche. */
  revealRoles: boolean;
}

export type Winner = 'CIVILS' | 'UNDERCOVER' | 'MR_WHITE';

export interface Outcome {
  winner: Winner;
  /** Joueurs gagnants (pour le score et l'affichage) */
  winnerIds: string[];
  /** Phrase expliquant la victoire */
  reason: string;
  /** true si Mr White a deviné le mot */
  byGuess: boolean;
}

export interface Vote {
  voterId: string;
  targetId: string;
}

export type VoteOutcome = 'eliminated' | 'tie' | 'noElimination';

export interface VoteResult {
  round: number;
  ballots: Vote[];
  tallies: Record<string, number>;
  outcome: VoteOutcome;
  /** Joueur éliminé (outcome = 'eliminated') */
  eliminatedId: string | null;
  /** Joueurs à égalité (outcome = 'tie') */
  tiedIds: string[];
}

/** Actions qu'un client peut envoyer (validées par `parseAction`). */
export type ClientAction =
  | { type: 'updateSettings'; settings: Partial<GameSettings> }
  | { type: 'startGame' }
  | { type: 'ready' }
  | { type: 'submitClue'; text: string }
  | { type: 'vote'; targetId: string }
  | { type: 'guess'; word: string }
  | { type: 'next' }
  | { type: 'force' }
  | { type: 'newRound' }
  | { type: 'leave' };

// ——— 2. Serveur uniquement ———————————————————————————————————————

export interface ServerPlayer {
  id: string;
  /** Secret d'authentification du joueur (jamais diffusé aux autres) */
  token: string;
  name: string;
  joinedAt: number;
  /** Nombre de flux SSE ouverts (plusieurs onglets possibles) */
  connections: number;
  disconnectedAt: number | null;
  /** Absent depuis trop longtemps : ne bloque plus la partie */
  away: boolean;
  /** A quitté la room en cours de partie */
  left: boolean;
}

export interface Assignment {
  role: Role;
  /** null pour Mr White */
  word: string | null;
}

export interface EliminatedEntry {
  playerId: string;
  role: Role;
  turn: number;
  reason: 'vote' | 'left';
}

export interface ClueEntry {
  text: string;
  skipped: boolean;
}

export interface GameData {
  themeLabel: string;
  civilianWord: string;
  undercoverWord: string;
  assignments: Record<string, Assignment>;
  alive: string[];
  eliminated: EliminatedEntry[];
  clueOrder: string[];
  clues: Record<string, ClueEntry>;
  ready: string[];
  votes: Vote[];
  /** null = tous les joueurs en vie sont éligibles */
  voteCandidates: string[] | null;
  voteRound: number;
  voteResult: VoteResult | null;
  /** Joueur éliminé au dernier vote (phase ELIMINATION) */
  eliminationId: string | null;
  /** Mr White qui doit tenter de deviner le mot */
  pendingGuess: string | null;
  guess: { playerId: string; word: string; correct: boolean } | null;
  /** Nombre de tours consécutifs sans élimination */
  stalledTurns: number;
  outcome: Outcome | null;
  /** Points gagnés à cette manche */
  roundScores: Record<string, number>;
}

export interface Room {
  code: string;
  hostId: string;
  players: ServerPlayer[];
  settings: GameSettings;
  phase: GamePhase;
  round: number;
  turn: number;
  /** Incrémenté à chaque changement de phase */
  revision: number;
  scores: Record<string, number>;
  game: GameData | null;
  /** Paires déjà jouées dans cette room (évite les répétitions) */
  usedPairs: string[];
  createdAt: number;
  updatedAt: number;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

// ——— 3. Public / privé (envoyé aux clients) ————————————————————————————

export interface PublicPlayer {
  id: string;
  name: string;
  isHost: boolean;
  connected: boolean;
  away: boolean;
  left: boolean;
  alive: boolean;
  score: number;
  hasClue: boolean;
  ready: boolean;
  hasVoted: boolean;
  /** Rôle : uniquement pour les joueurs éliminés, ou en fin de manche */
  role: Role | null;
}

export interface PublicClue {
  playerId: string;
  text: string;
  skipped: boolean;
}

export interface PublicRoom {
  code: string;
  phase: GamePhase;
  round: number;
  turn: number;
  revision: number;
  hostId: string;
  settings: GameSettings;
  themeLabel: string | null;
  players: PublicPlayer[];
  limits: { min: number; max: number };
  composition: { civil: number; undercover: number; mrWhite: number; valid: boolean };
  clueOrder: string[];
  currentSpeakerId: string | null;
  clues: PublicClue[];
  voting: {
    round: number;
    candidates: string[] | null;
    voted: number;
    expected: number;
  } | null;
  voteResult: VoteResult | null;
  elimination: {
    playerId: string;
    role: Role;
    awaitingGuess: boolean;
    guess: { word: string; correct: boolean } | null;
  } | null;
  outcome: Outcome | null;
  /** Révélé uniquement en GAME_OVER */
  reveal: { civilianWord: string; undercoverWord: string; roles: Record<string, Role> } | null;
  roundScores: Record<string, number>;
}

export interface PrivateView {
  playerId: string;
  isHost: boolean;
  /** Rôle et mot du joueur lui-même (null en lobby) */
  role: Role | null;
  word: string | null;
  /** Vote du joueur pour le tour de vote en cours */
  myVote: string | null;
}

/** Ce que reçoit un client : la vue publique + SA vue privée. */
export interface RoomView {
  room: PublicRoom;
  me: PrivateView;
}

// ——— API ————————————————————————————————————————————————————

export interface JoinResponse {
  code: string;
  playerId: string;
  token: string;
}

export interface PeekResponse {
  exists: boolean;
  joinable: boolean;
  reason: string | null;
  phase: GamePhase | null;
  playerCount: number;
  max: number;
}
