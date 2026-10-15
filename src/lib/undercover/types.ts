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
  /** Au moins 1, borné par la taille de la table (voir `maxImpostors` dans rules.ts). */
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
  | { type: 'startVote' }
  | { type: 'vote'; targetId: string }
  | { type: 'guess'; word: string }
  | { type: 'next' }
  | { type: 'force' }
  | { type: 'newRound' }
  | { type: 'seat'; play: boolean }
  | { type: 'chat'; text: string }
  | { type: 'visibility'; public: boolean }
  | { type: 'rename'; name: string }
  | { type: 'giveLead'; targetId: string }
  | { type: 'leave' };

/**
 * Place d'une personne dans la room :
 *  - `player` : joue (en lobby : jouera la prochaine manche) ;
 *  - `queue`  : spectateur en file d'attente, assis automatiquement dès qu'une place se libère en lobby ;
 *  - `watch`  : spectateur qui regarde seulement (jamais assis automatiquement).
 */
export type Seat = 'player' | 'queue' | 'watch';

// ——— 2. Serveur uniquement ———————————————————————————————————————

export interface ServerPlayer {
  id: string;
  /** Secret d'authentification du joueur (jamais diffusé aux autres) */
  token: string;
  name: string;
  joinedAt: number;
  seat: Seat;
  /** Entrée dans la file d'attente (ordre d'arrivée), null hors file */
  queuedAt: number | null;
  /** Horodatages des derniers messages de chat (limitation de débit) */
  recentChats: number[];
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

export interface PastClue {
  turn: number;
  playerId: string;
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
  /** Indices des tours précédents de CETTE manche (remis à zéro à chaque nouvelle manche) :
   *  déjà publics au moment où ils ont été donnés, jamais un secret. */
  clueHistory: PastClue[];
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

export interface ChatMessage {
  id: number;
  playerId: string;
  /** Prénom au moment de l'envoi (l'auteur peut avoir quitté la room depuis) */
  name: string;
  text: string;
  /**
   * Message d'un éliminé ou d'un spectateur pendant une manche : invisible des joueurs encore en vie
   * jusqu'à la fin de la manche (un éliminé connaît son mot, il ne doit pas pouvoir le souffler).
   */
  ghost: boolean;
}

export interface Room {
  code: string;
  hostId: string;
  /** Joueurs ET spectateurs (voir `ServerPlayer.seat`) */
  players: ServerPlayer[];
  settings: GameSettings;
  phase: GamePhase;
  round: number;
  turn: number;
  /** Incrémenté à chaque changement de phase */
  revision: number;
  scores: Record<string, number>;
  game: GameData | null;
  /** Partie publique : visible dans la liste des parties en cours de l'accueil du jeu */
  isPublic: boolean;
  /** Paires déjà jouées dans cette room (évite les répétitions) */
  usedPairs: string[];
  /** Derniers messages du chat (les plus anciens sont supprimés au-delà de `LIMITS.chatHistory`) */
  chat: ChatMessage[];
  chatSeq: number;
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

export interface PublicSpectator {
  id: string;
  name: string;
  isHost: boolean;
  connected: boolean;
  /** Points des manches déjà jouées (un spectateur a pu jouer avant) */
  score: number;
  /** Position dans la file d'attente (1 = prochain assis), null s'il regarde seulement */
  queuePosition: number | null;
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
  isPublic: boolean;
  settings: GameSettings;
  themeLabel: string | null;
  /** Joueurs assis à la table (les participants de la manche une fois lancée) */
  players: PublicPlayer[];
  /** Spectateurs : file d'attente puis simples observateurs */
  spectators: PublicSpectator[];
  limits: { min: number };
  /**
   * Imposteurs encore en jeu (à démasquer) pendant une manche, null sinon. Déductible des infos
   * publiques (composition + rôles des éliminés) : ce n'est pas un secret.
   */
  impostors: { undercover: number; mrWhite: number } | null;
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
  /** Indices des tours précédents de la manche en cours (déjà publics quand ils ont été donnés) */
  clueHistory: PastClue[];
}

export interface PrivateView {
  playerId: string;
  isHost: boolean;
  seat: Seat;
  /** Rôle et mot du joueur lui-même (null en lobby) */
  role: Role | null;
  word: string | null;
  /** Vote du joueur pour le tour de vote en cours */
  myVote: string | null;
}

export interface PublicChatMessage {
  id: number;
  playerId: string;
  name: string;
  text: string;
  ghost: boolean;
}

/** Ce que reçoit un client : la vue publique + SA vue privée + le chat qu'il a le droit de lire. */
export interface RoomView {
  room: PublicRoom;
  me: PrivateView;
  chat: PublicChatMessage[];
}

// ——— API ————————————————————————————————————————————————————

export interface JoinResponse {
  code: string;
  playerId: string;
  token: string;
}

/** Une partie publique telle que listée sur l'accueil du jeu (aucune info de jeu secrète). */
export interface PublicRoomSummary {
  code: string;
  hostName: string;
  phase: GamePhase;
  round: number;
  players: number;
  spectators: number;
}

export interface PeekResponse {
  exists: boolean;
  joinable: boolean;
  /** true si l'arrivant entrera comme spectateur (partie en cours ou table pleine) */
  spectator: boolean;
  reason: string | null;
  phase: GamePhase | null;
  playerCount: number;
}
