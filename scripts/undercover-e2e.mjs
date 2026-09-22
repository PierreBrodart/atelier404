// Test de bout en bout du multijoueur Undercover, contre un serveur Next réellement lancé.
//   npm run build && npm start   (dans un terminal)
//   node scripts/undercover-e2e.mjs http://localhost:3000 [--slow]
// --slow ajoute les tests de présence (absence 30 s, transfert de host 15 s : ~45 s).

const BASE = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'http://localhost:3000';
const SLOW = process.argv.includes('--slow');

let checks = 0;
const failures = [];
const check = (condition, label) => {
  checks += 1;
  if (!condition) {
    failures.push(label);
    console.log(`  ✗ ${label}`);
  }
};
const section = (title) => console.log(`\n▸ ${title}`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function api(body) {
  const response = await fetch(`${BASE}/api/undercover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: response.status, ...(await response.json()) };
}

class Client {
  constructor(name) {
    this.name = name;
    this.view = null;
    this.raw = '';
    this.history = []; // toutes les vues brutes reçues (pour l'audit de confidentialité)
    this.abort = null;
  }

  async create() {
    const res = await api({ type: 'create', name: this.name });
    Object.assign(this, { code: res.code, playerId: res.playerId, token: res.token });
    return res;
  }

  async join(code) {
    const res = await api({ type: 'join', code, name: this.name });
    if (res.ok) Object.assign(this, { code: res.code, playerId: res.playerId, token: res.token });
    return res;
  }

  connect() {
    this.abort = new AbortController();
    return new Promise((resolve, reject) => {
      fetch(`${BASE}/api/undercover/stream?code=${this.code}&token=${this.token}`, { signal: this.abort.signal })
        .then(async (response) => {
          if (response.status !== 200) return reject(new Error(`stream ${response.status}`));
          resolve();
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let index;
            while ((index = buffer.indexOf('\n\n')) >= 0) {
              const chunk = buffer.slice(0, index);
              buffer = buffer.slice(index + 2);
              const data = chunk.split('\n').find((line) => line.startsWith('data: '));
              if (data) {
                this.raw = data.slice(6);
                this.history.push(this.raw);
                this.view = JSON.parse(this.raw);
              }
            }
          }
        })
        .catch((error) => error.name !== 'AbortError' && reject(error));
    });
  }

  disconnect() {
    this.abort?.abort();
  }

  act(action) {
    return api({ type: 'action', code: this.code, token: this.token, action });
  }

  get room() {
    return this.view?.room;
  }
  get me() {
    return this.view?.me;
  }
}

async function waitFor(predicate, label, timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (predicate()) return true;
    await sleep(25);
  }
  check(false, `timeout : ${label}`);
  return false;
}

const everyone = (clients, predicate) => clients.every((client) => client.view && predicate(client));
const phaseIs = (clients, phase) => everyone(clients, (client) => client.room.phase === phase);

async function toPhase(clients, phase, timeout = 5000) {
  return waitFor(() => phaseIs(clients, phase), `phase ${phase}`, timeout);
}

/** Joue REVEAL → CLUES → VOTING avec des actions valides. */
async function playUntilVoting(clients, order = clients) {
  await toPhase(clients, 'REVEAL');
  for (const client of order) await client.act({ type: 'ready' });
  await toPhase(clients, 'CLUES');

  // Un joueur qui n'est pas le tour ne peut pas donner d'indice
  const speaker0 = clients.find((c) => c.playerId === clients[0].room.currentSpeakerId);
  const notSpeaker = clients.find((c) => c.playerId !== speaker0.playerId && c.room.players.find((p) => p.id === c.playerId).alive);
  const refused = await notSpeaker.act({ type: 'submitClue', text: 'coupe-file' });
  check(!refused.ok, 'un joueur hors tour ne peut pas donner d’indice');
  await cluesToVoting(clients);
}

/** CLUES → VOTING (tous les joueurs en vie jouent leur tour, puis le host lance le vote). */
async function cluesToVoting(clients) {
  await toPhase(clients, 'CLUES');
  for (let guard = 0; guard < 12 && clients[0].room.phase === 'CLUES'; guard += 1) {
    const id = clients[0].room.currentSpeakerId;
    if (!id) break;
    const speaker = clients.find((c) => c.playerId === id);
    const res = await speaker.act({ type: 'submitClue', text: `indice de ${speaker.name}` });
    check(res.ok, `indice de ${speaker.name}`);
    await waitFor(() => clients[0].room.currentSpeakerId !== id || clients[0].room.phase !== 'CLUES', 'tour suivant');
  }
  // Une fois tout le monde passé, la partie n'enchaîne plus toute seule : il faut l'action du host.
  check(clients[0].room.phase === 'CLUES' && clients[0].room.currentSpeakerId === null, 'attend le host après le dernier indice');
  const host = clients.find((c) => c.me.isHost);
  const started = await host.act({ type: 'startVote' });
  check(started.ok, 'le host lance le vote');
  await waitFor(() => phaseIs(clients, 'VOTING'), 'phase VOTING', 10000);
}

const byRole = (clients, role) => clients.filter((client) => client.me.role === role);
const aliveOf = (clients) => clients.filter((c) => c.room.players.find((p) => p.id === c.playerId).alive);

async function castVotes(clients, targets) {
  // targets : { [nom du votant]: nom de la cible }
  for (const [voterName, targetName] of Object.entries(targets)) {
    const voter = clients.find((c) => c.name === voterName);
    const target = clients.find((c) => c.name === targetName);
    const res = await voter.act({ type: 'vote', targetId: target.playerId });
    check(res.ok, `${voterName} vote ${targetName}`);
  }
}

// ——— Scénario ———————————————————————————————————————————————————

async function main() {
  console.log(`Undercover e2e → ${BASE}`);

  // ————— Lobby —————
  section('Création, lobby, configuration');
  const [alice, bruno, chloe, david, eva] = ['Alice', 'Bruno', 'Chloé', 'David', 'Eva'].map((n) => new Client(n));
  const all = [alice, bruno, chloe, david, eva];

  const created = await alice.create();
  check(created.ok && /^[A-HJ-NP-Z2-9]{5}$/.test(created.code), `code de room valide (${created.code})`);

  const denied = await fetch(`${BASE}/api/undercover/stream?code=${alice.code}&token=nope`);
  check(denied.status === 401, 'flux SSE refusé avec un mauvais jeton (401)');
  await denied.body?.cancel();

  await alice.connect();
  await waitFor(() => alice.view, 'vue initiale');
  check(alice.room.phase === 'LOBBY' && alice.room.hostId === alice.playerId && alice.me.isHost, 'Alice est host en LOBBY');

  for (const client of [bruno, chloe, david]) {
    const res = await client.join(alice.code);
    check(res.ok, `${client.name} rejoint`);
    await client.connect();
  }
  await waitFor(() => everyone([alice, bruno, chloe, david], (c) => c.room.players.length === 4), '4 joueurs synchronisés');
  check(alice.room.players.filter((p) => p.isHost).length === 1, 'un seul host');

  const dup = await new Client('alice').join(alice.code);
  check(!dup.ok, 'prénom déjà pris refusé');

  // Configuration : 4 joueurs → 1 Undercover + 1 Mr White est incohérent (2 civils contre 2 imposteurs)
  await alice.act({ type: 'updateSettings', settings: { undercoverCount: 1, mrWhiteCount: 1, themeId: 'animaux' } });
  await waitFor(() => bruno.room.settings.themeId === 'animaux', 'thème synchronisé');
  check(alice.room.composition.valid, 'composition incohérente corrigée automatiquement');
  check(bruno.room.settings.themeId === 'animaux', 'thème visible par les autres joueurs');

  const nonHostSettings = await bruno.act({ type: 'updateSettings', settings: { themeId: 'films' } });
  check(!nonHostSettings.ok, 'un joueur non host ne peut pas changer la config');
  const nonHostStart = await bruno.act({ type: 'startGame' });
  check(!nonHostStart.ok, 'un joueur non host ne peut pas lancer');

  await eva.join(alice.code);
  await eva.connect();
  await waitFor(() => alice.room.players.length === 5, '5 joueurs');
  await alice.act({ type: 'updateSettings', settings: { undercoverCount: 1, mrWhiteCount: 1, themeId: 'random' } });
  await waitFor(() => alice.room.composition.mrWhite === 1 && alice.room.composition.undercover === 1, 'composition 1U + 1W');
  check(alice.room.composition.civil === 3 && alice.room.composition.valid, '5 joueurs : 3 civils, 1 undercover, 1 Mr White');

  const tooMany = await alice.act({ type: 'updateSettings', settings: { undercoverCount: 4, mrWhiteCount: 3 } });
  check(tooMany.ok && alice.room.composition.valid !== undefined, 'demande extrême acceptée mais normalisée');
  await waitFor(() => alice.room.composition.valid, 'composition normalisée');
  await alice.act({ type: 'updateSettings', settings: { undercoverCount: 1, mrWhiteCount: 1 } });
  await waitFor(() => alice.room.composition.mrWhite === 1 && alice.room.composition.undercover === 1, 'retour à 1U + 1W');

  // ————— Manche 1 —————
  section('Manche 1 : distribution, confidentialité, égalité, Mr White éliminé (mauvaise réponse), victoire des civils');
  const start = await alice.act({ type: 'startGame' });
  check(start.ok, 'la partie démarre');
  await toPhase(all, 'REVEAL');

  const late = await new Client('Retard').join(alice.code);
  check(!late.ok, 'un joueur qui arrive trop tard est refusé');

  const roles = Object.fromEntries(all.map((c) => [c.name, c.me.role]));
  check(byRole(all, 'CIVIL').length === 3 && byRole(all, 'UNDERCOVER').length === 1 && byRole(all, 'MR_WHITE').length === 1, `rôles distribués : ${JSON.stringify(roles)}`);

  const civilianWord = byRole(all, 'CIVIL')[0].me.word;
  const undercoverWord = byRole(all, 'UNDERCOVER')[0].me.word;
  check(byRole(all, 'CIVIL').every((c) => c.me.word === civilianWord), 'tous les civils ont le même mot');
  check(civilianWord !== undercoverWord && Boolean(civilianWord) && Boolean(undercoverWord), 'les mots civil / undercover sont différents');
  check(byRole(all, 'MR_WHITE')[0].me.word === null, 'Mr White ne reçoit aucun mot');

  // Confidentialité : AUCUNE vue reçue (historique complet) ne doit contenir un secret qui n'est pas le sien.
  const tokens = all.map((c) => c.token);
  for (const client of all) {
    const joined = client.history.join('\n');
    const others = all.filter((o) => o !== client);
    check(others.every((o) => !joined.includes(o.token)), `${client.name} : aucun jeton d’un autre joueur dans ses vues`);
    check(!joined.includes('assignments') && !joined.includes('"token"'), `${client.name} : pas de champ interne (assignments / token)`);
    if (client.me.role === 'MR_WHITE') {
      check(!joined.includes(`"${civilianWord}"`) && !joined.includes(`"${undercoverWord}"`), 'Mr White ne voit aucun des deux mots');
    }
    if (client.me.role === 'CIVIL') check(!joined.includes(`"${undercoverWord}"`), `${client.name} (civil) ne voit pas le mot undercover`);
    if (client.me.role === 'UNDERCOVER') check(!joined.includes(`"${civilianWord}"`), 'l’Undercover ne voit pas le mot civil');
    check(client.room.players.every((p) => p.role === null), `${client.name} : aucun rôle public en REVEAL`);
    check(client.room.reveal === null, `${client.name} : pas de révélation avant la fin`);
  }
  void tokens;

  await playUntilVoting(all);

  const white = byRole(all, 'MR_WHITE')[0];
  const civilians = byRole(all, 'CIVIL');
  const undercover = byRole(all, 'UNDERCOVER')[0];
  const c1 = civilians[0];

  const selfVote = await alice.act({ type: 'vote', targetId: alice.playerId });
  check(!selfVote.ok, 'impossible de voter pour soi-même');

  // Égalité : white (2 voix) contre c1 (2 voix)
  const [v1, v2, v3] = all.filter((c) => c !== white && c !== c1);
  await castVotes(all, { [white.name]: c1.name, [c1.name]: white.name, [v1.name]: white.name, [v2.name]: c1.name });
  const revote = await v1.act({ type: 'vote', targetId: c1.playerId });
  check(!revote.ok, 'le vote ne peut pas être modifié');
  check(aliveOf(all).every((c) => c.view.me.myVote !== undefined), 'myVote privé disponible');
  check(!alice.raw.includes('"ballots":[{'), 'les bulletins ne sont pas publics pendant le vote');
  await castVotes(all, { [v3.name]: v1.name });
  await toPhase(all, 'RESULT');
  check(alice.room.voteResult.outcome === 'tie', 'égalité détectée');
  check(alice.room.voteResult.tiedIds.length === 2, 'deux joueurs à égalité');
  check(alice.room.players.every((p) => p.role === null), 'aucun rôle révélé pendant l’égalité');

  const notHostNext = await bruno.act({ type: 'next' });
  check(alice.me.isHost ? !notHostNext.ok || bruno.me.isHost : true, 'seul le host continue');
  const host = all.find((c) => c.me.isHost);
  await host.act({ type: 'next' });
  await toPhase(all, 'VOTING');
  check(alice.room.voting.round === 2 && alice.room.voting.candidates.length === 2, 'nouveau vote restreint aux ex æquo');

  const outsideCandidate = await v1.act({ type: 'vote', targetId: v2.playerId });
  check(!outsideCandidate.ok, 'vote hors candidats refusé pendant le re-vote');
  // re-vote : Mr White éliminé
  const votesRound2 = {};
  for (const voter of all) votesRound2[voter.name] = voter === white ? c1.name : white.name;
  await castVotes(all, votesRound2);
  await toPhase(all, 'RESULT');
  check(alice.room.voteResult.outcome === 'eliminated' && alice.room.voteResult.eliminatedId === white.playerId, 'Mr White éliminé au second vote');
  check(alice.room.players.find((p) => p.id === white.playerId).role === null, 'rôle encore secret avant la phase ÉLIMINATION');
  await host.act({ type: 'next' });
  await toPhase(all, 'ELIMINATION');
  check(alice.room.elimination.role === 'MR_WHITE' && alice.room.elimination.awaitingGuess, 'rôle de l’éliminé révélé + dernière chance de Mr White');
  check(alice.room.players.find((p) => p.id === white.playerId).role === 'MR_WHITE', 'le rôle de l’éliminé est public');

  const earlyNext = await host.act({ type: 'next' });
  check(!earlyNext.ok, 'on ne continue pas avant la réponse de Mr White');
  const wrongPlayerGuess = await c1.act({ type: 'guess', word: civilianWord });
  check(!wrongPlayerGuess.ok, 'seul Mr White peut deviner');
  await white.act({ type: 'guess', word: 'zzzzzz' });
  await waitFor(() => alice.room.elimination?.guess?.correct === false, 'mauvaise réponse annoncée');
  await host.act({ type: 'next' });
  await toPhase(all, 'CLUES');
  check(alice.room.turn === 2, 'tour suivant');

  // Tour 2 : on élimine l'Undercover → victoire des civils
  const survivors = aliveOf(all);
  check(survivors.length === 4, '4 joueurs en vie');
  await waitFor(() => everyone(all, (c) => c.room.currentSpeakerId), 'orateur');
  for (let guard = 0; guard < 6 && alice.room.phase === 'CLUES'; guard += 1) {
    const id = alice.room.currentSpeakerId;
    if (!id) break;
    await survivors.find((c) => c.playerId === id).act({ type: 'submitClue', text: '' });
    await waitFor(() => alice.room.currentSpeakerId !== id || alice.room.phase !== 'CLUES', 'orateur suivant');
  }
  await toPhase(all, 'VOTING');
  const votes2 = {};
  for (const voter of survivors) votes2[voter.name] = voter === undercover ? civilians.find((c) => c !== voter).name : undercover.name;
  await castVotes(all, votes2);
  await toPhase(all, 'RESULT');
  await host.act({ type: 'next' });
  await toPhase(all, 'ELIMINATION');
  await host.act({ type: 'next' });
  await toPhase(all, 'GAME_OVER');
  check(alice.room.outcome.winner === 'CIVILS', 'victoire des civils');
  check(alice.room.reveal.civilianWord === civilianWord && alice.room.reveal.undercoverWord === undercoverWord, 'mots révélés en fin de manche');
  check(all.every((c) => c.room.players.every((p) => p.role !== null)), 'tous les rôles révélés en fin de manche');
  const scores = Object.fromEntries(alice.room.players.map((p) => [p.name, p.score]));
  check(civilians.every((c) => scores[c.name] === 2) && scores[undercover.name] === 0 && scores[white.name] === 0, `scores manche 1 : ${JSON.stringify(scores)}`);

  // ————— Manche 2 —————
  section('Manche 2 : nouvelle manche, Mr White devine le mot');
  const nonHostNewRound = await all.find((c) => !c.me.isHost).act({ type: 'newRound' });
  check(!nonHostNewRound.ok, 'seul le host relance une manche');
  await host.act({ type: 'newRound' });
  await toPhase(all, 'LOBBY');
  check(alice.room.round === 2 && alice.room.players.length === 5, 'la room et les joueurs sont conservés');
  check(alice.room.players.find((p) => p.name === civilians[0].name).score === 2, 'les scores sont conservés');
  await host.act({ type: 'updateSettings', settings: { themeId: 'films' } });
  await waitFor(() => alice.room.settings.themeId === 'films', 'thème modifié entre deux manches');
  await host.act({ type: 'startGame' });
  await toPhase(all, 'REVEAL');
  check(alice.room.themeLabel === 'Films', 'thème choisi appliqué');

  await playUntilVoting(all);
  const white2 = byRole(all, 'MR_WHITE')[0];
  const civ2 = byRole(all, 'CIVIL');
  const word2 = civ2[0].me.word;
  const votes = {};
  for (const voter of all) votes[voter.name] = voter === white2 ? civ2[0].name : white2.name;
  await castVotes(all, votes);
  await toPhase(all, 'RESULT');
  await host.act({ type: 'next' });
  await toPhase(all, 'ELIMINATION');
  const before = Object.fromEntries(alice.room.players.map((p) => [p.name, p.score]));
  await white2.act({ type: 'guess', word: word2.toUpperCase() });
  await toPhase(all, 'GAME_OVER');
  check(alice.room.outcome.winner === 'MR_WHITE' && alice.room.outcome.byGuess, 'Mr White gagne en devinant (insensible à la casse)');
  const after = Object.fromEntries(alice.room.players.map((p) => [p.name, p.score]));
  check(after[white2.name] === before[white2.name] + 6, 'Mr White marque 6 points');

  // ————— Départ / host —————
  section('Départ d’un joueur et transfert du host');
  await host.act({ type: 'newRound' });
  await toPhase(all, 'LOBBY');
  const oldHost = all.find((c) => c.me.isHost);
  await oldHost.act({ type: 'leave' });
  const remaining = all.filter((c) => c !== oldHost);
  await waitFor(() => everyone(remaining, (c) => c.room.players.length === 4 && c.room.hostId !== oldHost.playerId), 'départ du host en lobby');
  check(remaining.some((c) => c.me.isHost), 'le host est transféré à un autre joueur');
  const gone = await oldHost.act({ type: 'ready' });
  check(!gone.ok, 'un joueur parti n’a plus accès à la room');

  // ————— Départ en pleine partie —————
  section('Départ en pleine partie : victoire automatique');
  const host3 = remaining.find((c) => c.me.isHost);
  await host3.act({ type: 'updateSettings', settings: { undercoverCount: 1, mrWhiteCount: 0 } });
  await host3.act({ type: 'startGame' });
  await toPhase(remaining, 'REVEAL');
  const und3 = byRole(remaining, 'UNDERCOVER')[0];
  await und3.act({ type: 'leave' });
  const rest = remaining.filter((c) => c !== und3);
  await toPhase(rest, 'GAME_OVER');
  check(rest[0].room.outcome.winner === 'CIVILS', 'si l’unique Undercover part, les civils gagnent');

  await persistentTieScenario();

  if (SLOW) await slowTests();

  console.log(`\n${checks - failures.length}/${checks} vérifications réussies`);
  if (failures.length) {
    console.log('\nÉchecs :');
    failures.forEach((label) => console.log(` - ${label}`));
    process.exitCode = 1;
  }
  for (const client of [...all]) client.disconnect();
}


async function persistentTieScenario() {
  section('Égalité persistante, tours sans élimination, victoire des Undercover');
  const four = ['Jade', 'Kevin', 'Lou', 'Malo'].map((n) => new Client(n));
  const [host, ...others] = four;
  await host.create();
  await host.connect();
  for (const p of others) {
    await p.join(host.code);
    await p.connect();
  }
  await waitFor(() => everyone(four, (c) => c.room.players.length === 4), '4 joueurs');
  await host.act({ type: 'updateSettings', settings: { undercoverCount: 1, mrWhiteCount: 0, themeId: 'sports' } });
  await host.act({ type: 'startGame' });
  await playUntilVoting(four);

  const [x, y, v1, v2] = four;
  for (let turn = 1; turn <= 3; turn += 1) {
    if (turn > 1) await cluesToVoting(four);
    for (let round = 1; round <= 3; round += 1) {
      await waitFor(() => four.every((c) => c.room.phase === 'VOTING' && c.room.voting.round === round), `vote ${turn}.${round}`);
      await castVotes(four, { [x.name]: y.name, [y.name]: x.name, [v1.name]: x.name, [v2.name]: y.name });
      await toPhase(four, 'RESULT');
      const outcome = host.room.voteResult.outcome;
      check(outcome === (round < 3 ? 'tie' : 'noElimination'), `tour ${turn}, vote ${round} : ${outcome}`);
      if (round < 3) await host.act({ type: 'next' });
    }
    check(four.every((c) => c.room.players.every((p) => p.role === null)), 'aucun rôle révélé sans élimination');
    await host.act({ type: 'next' });
    if (turn < 3) await toPhase(four, 'CLUES');
  }
  await toPhase(four, 'GAME_OVER');
  check(host.room.outcome.winner === 'UNDERCOVER', 'après 3 tours sans élimination, les Undercover gagnent');
  const under = four.find((c) => c.me.role === 'UNDERCOVER');
  check(host.room.roundScores[under.playerId] === 10, 'l’Undercover marque 10 points');
  for (const c of four) c.disconnect();

  // Victoire par parité : 6 joueurs (4 civils + 2 undercover) → après 2 civils éliminés, 2 contre 2.
  const five = ['Nora', 'Oscar', 'Paul', 'Rita', 'Sam', 'Tess'].map((n) => new Client(n));
  const [h2, ...rest] = five;
  await h2.create();
  await h2.connect();
  for (const p of rest) {
    await p.join(h2.code);
    await p.connect();
  }
  await waitFor(() => everyone(five, (c) => c.room.players.length === 6), '6 joueurs');
  await h2.act({ type: 'updateSettings', settings: { undercoverCount: 2, mrWhiteCount: 0 } });
  await h2.act({ type: 'startGame' });
  await playUntilVoting(five);
  const civs = five.filter((c) => c.me.role === 'CIVIL');
  const unders = five.filter((c) => c.me.role === 'UNDERCOVER');
  check(civs.length === 4 && unders.length === 2, '6 joueurs : 4 civils + 2 undercover');
  // Tour 1 : un civil éliminé
  let votes = {};
  for (const voter of five) votes[voter.name] = voter === civs[0] ? civs[1].name : civs[0].name;
  await castVotes(five, votes);
  await toPhase(five, 'RESULT');
  await h2.act({ type: 'next' });
  await toPhase(five, 'ELIMINATION');
  await h2.act({ type: 'next' });
  await toPhase(five, 'CLUES');
  const alive = five.filter((c) => c !== civs[0]);
  await cluesToVoting(five);
  // Tour 2 : un second civil éliminé → 2 civils contre 2 undercover
  votes = {};
  for (const voter of alive) votes[voter.name] = voter === civs[1] ? civs[2].name : civs[1].name;
  await castVotes(five, votes);
  await toPhase(five, 'RESULT');
  await h2.act({ type: 'next' });
  await toPhase(five, 'ELIMINATION');
  const eliminated = h2.room.elimination.playerId;
  check(eliminated === civs[1].playerId, 'le second civil est éliminé');
  const dead = await civs[0].act({ type: 'vote', targetId: unders[0].playerId });
  check(!dead.ok, 'un joueur éliminé ne peut plus voter');
  await h2.act({ type: 'next' });
  await toPhase(five, 'GAME_OVER');
  check(h2.room.outcome.winner === 'UNDERCOVER', 'victoire des Undercover par parité');
  check(h2.room.outcome.winnerIds.length === 2, 'les deux Undercover gagnent');
  for (const c of five) c.disconnect();
}

async function slowTests() {
  section('Présence : déconnexion, absence, transfert de host, reconnexion (~45 s)');
  const players = ['Fanny', 'Gaspard', 'Hugo', 'Iris'].map((n) => new Client(n));
  const [host, p2, p3, p4] = players;
  await host.create();
  await host.connect();
  for (const p of [p2, p3, p4]) {
    await p.join(host.code);
    await p.connect();
  }
  await waitFor(() => everyone(players, (c) => c.room.players.length === 4), '4 joueurs');
  await host.act({ type: 'startGame' });
  await toPhase(players, 'REVEAL');

  host.disconnect();
  await waitFor(() => p2.room.players.find((p) => p.id === host.playerId).connected === false, 'déconnexion visible par les autres');
  for (const p of [p2, p3, p4]) await p.act({ type: 'ready' });
  await sleep(2500);
  check(p2.room.phase === 'REVEAL', 'la partie attend brièvement le joueur déconnecté');

  await waitFor(() => p2.room.phase === 'CLUES', 'la partie continue sans le joueur absent', 45_000);
  check(p2.room.players.find((p) => p.id === host.playerId).away, 'le joueur déconnecté est marqué absent');
  check(p2.room.hostId !== host.playerId, 'le host déconnecté a été remplacé');

  await host.connect();
  await waitFor(() => host.view && host.room.players.find((p) => p.id === host.playerId).connected, 'reconnexion avec le même jeton');
  check(host.me.role !== null, 'après rechargement, le joueur retrouve son rôle');
  check(!host.room.players.find((p) => p.id === host.playerId).away, 'plus absent après reconnexion');
  for (const p of players) p.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
  process.exit(1);
});
