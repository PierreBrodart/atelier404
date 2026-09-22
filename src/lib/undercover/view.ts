import { LIMITS, composition } from './rules';
import { currentSpeaker } from './engine';
import type { PublicPlayer, PublicRoom, Role, Room, RoomView } from './types';

/**
 * Projection d'une Room vers ce qu'un joueur a le droit de voir.
 *
 * RÈGLE D'OR : on construit des objets explicites (liste blanche), on ne « copie » jamais
 * la Room ni ses sous-objets. Les rôles et les mots des autres joueurs n'apparaissent
 * qu'au moment où ils sont publics dans les règles :
 *  - le rôle d'un joueur ÉLIMINÉ (après son élimination) ;
 *  - tous les rôles et les deux mots en fin de manche (GAME_OVER).
 * Les jetons d'authentification et les votes en cours ne sont jamais exposés.
 */

function publicRoom(room: Room): PublicRoom {
  const game = room.game;
  const gameOver = room.phase === 'GAME_OVER';
  const players = room.players.filter((player) => room.phase !== 'LOBBY' || !player.left);

  const revealedRole = (id: string): Role | null => {
    if (!game) return null;
    if (gameOver) return game.assignments[id]?.role ?? null;
    return game.eliminated.find((entry) => entry.playerId === id)?.role ?? null;
  };

  const voting = room.phase === 'VOTING';
  const publicPlayers: PublicPlayer[] = players.map((player) => ({
    id: player.id,
    name: player.name,
    isHost: player.id === room.hostId,
    connected: player.connections > 0,
    away: player.away,
    left: player.left,
    alive: game ? game.alive.includes(player.id) : !player.left,
    score: room.scores[player.id] ?? 0,
    hasClue: Boolean(game?.clues[player.id]),
    ready: Boolean(game?.ready.includes(player.id)),
    hasVoted: voting && Boolean(game?.votes.some((vote) => vote.voterId === player.id)),
    role: revealedRole(player.id),
  }));

  const activeCount = players.filter((player) => !player.left).length;
  const comp = composition(activeCount, room.settings.undercoverCount, room.settings.mrWhiteCount);

  const eliminatedEntry = game?.eliminationId
    ? game.eliminated.find((entry) => entry.playerId === game.eliminationId)
    : undefined;

  const alivePresent = game ? game.alive.filter((id) => players.some((p) => p.id === id && !p.away && !p.left)) : [];

  return {
    code: room.code,
    phase: room.phase,
    round: room.round,
    turn: room.turn,
    revision: room.revision,
    hostId: room.hostId,
    settings: { ...room.settings },
    themeLabel: game ? game.themeLabel : null,
    players: publicPlayers,
    limits: { min: LIMITS.minPlayers, max: LIMITS.maxPlayers },
    composition: { ...comp },
    clueOrder: room.phase === 'CLUES' || room.phase === 'DISCUSSION' ? [...(game?.clueOrder ?? [])] : [],
    currentSpeakerId: currentSpeaker(room),
    clues: game
      ? Object.entries(game.clues).map(([playerId, clue]) => ({
          playerId,
          text: clue.text,
          skipped: clue.skipped,
        }))
      : [],
    voting:
      voting && game
        ? {
            round: game.voteRound,
            candidates: game.voteCandidates ? [...game.voteCandidates] : null,
            voted: game.votes.length,
            expected: alivePresent.length,
          }
        : null,
    voteResult:
      game?.voteResult && (room.phase === 'RESULT' || room.phase === 'ELIMINATION' || gameOver)
        ? {
            round: game.voteResult.round,
            ballots: game.voteResult.ballots.map((ballot) => ({ ...ballot })),
            tallies: { ...game.voteResult.tallies },
            outcome: game.voteResult.outcome,
            eliminatedId: game.voteResult.eliminatedId,
            tiedIds: [...game.voteResult.tiedIds],
          }
        : null,
    elimination:
      room.phase === 'ELIMINATION' && game && eliminatedEntry
        ? {
            playerId: eliminatedEntry.playerId,
            role: eliminatedEntry.role,
            awaitingGuess: Boolean(game.pendingGuess && !game.guess),
            guess: game.guess ? { word: game.guess.word, correct: game.guess.correct } : null,
          }
        : null,
    outcome: gameOver && game?.outcome ? { ...game.outcome, winnerIds: [...game.outcome.winnerIds] } : null,
    reveal:
      gameOver && game
        ? {
            civilianWord: game.civilianWord,
            undercoverWord: game.undercoverWord,
            roles: Object.fromEntries(Object.entries(game.assignments).map(([id, a]) => [id, a.role])),
          }
        : null,
    roundScores: gameOver && game ? { ...game.roundScores } : {},
  };
}

/** Vue complète destinée à UN joueur (publique + privée). */
export function toRoomView(room: Room, playerId: string): RoomView {
  const assignment = room.game?.assignments[playerId];
  const myVote =
    room.phase === 'VOTING' ? (room.game?.votes.find((vote) => vote.voterId === playerId)?.targetId ?? null) : null;

  return {
    room: publicRoom(room),
    me: {
      playerId,
      isHost: room.hostId === playerId,
      role: assignment?.role ?? null,
      word: assignment?.word ?? null,
      myVote,
    },
  };
}
