// Bots pour tester Undercover à la main avec un vrai navigateur.
//   node scripts/undercover-bots.mjs join ROOM 3            → 3 bots rejoignent la room
//   node scripts/undercover-bots.mjs step [--vote Nom]      → les bots jouent la phase courante
//   node scripts/undercover-bots.mjs status                 → phase + rôles des bots
// Variable d'environnement BASE (défaut http://localhost:3000).

import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.env.BASE ?? 'http://localhost:3000';
const FILE = join(tmpdir(), 'a404-undercover-bots.json');
const [command, ...args] = process.argv.slice(2);

const api = async (body) =>
  (await fetch(`${BASE}/api/undercover`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json();

async function view(bot) {
  const abort = new AbortController();
  const response = await fetch(`${BASE}/api/undercover/stream?code=${bot.code}&token=${bot.token}`, { signal: abort.signal });
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const data = buffer.split('\n').find((line) => line.startsWith('data: '));
    if (data && buffer.includes('\n\n')) {
      abort.abort();
      return JSON.parse(data.slice(6));
    }
  }
  throw new Error('flux fermé');
}

const act = (bot, action) => api({ type: 'action', code: bot.code, token: bot.token, action });
const load = () => JSON.parse(readFileSync(FILE, 'utf8'));

if (command === 'join') {
  const [code, count] = args;
  const bots = [];
  for (let i = 1; i <= Number(count ?? 3); i += 1) {
    const res = await api({ type: 'join', code, name: ['Lucas', 'Marie', 'Thomas', 'Emma', 'Hugo', 'Jade'][i - 1] ?? `Bot${i}` });
    if (!res.ok) throw new Error(res.error);
    bots.push({ name: res.name ?? `bot${i}`, ...res });
    // Connexion gardée ouverte : les bots restent « connectés » tant que ce processus tourne
    fetch(`${BASE}/api/undercover/stream?code=${res.code}&token=${res.token}`)
      .then(async (stream) => {
        const reader = stream.body.getReader();
        while (!(await reader.read()).done);
      })
      .catch(() => {});
  }
  writeFileSync(FILE, JSON.stringify(bots));
  console.log(`${bots.length} bots dans la room ${code} (Ctrl+C pour les déconnecter)`);
  await new Promise(() => {});
}

const bots = load();

if (command === 'status') {
  for (const bot of bots) {
    const v = await view(bot);
    console.log(`${v.room.players.find((p) => p.id === v.me.playerId).name}: ${v.room.phase} · ${v.me.role ?? '-'} · ${v.me.word ?? '-'}`);
  }
  process.exit(0);
}

if (command === 'step') {
  const voteName = args.includes('--vote') ? args[args.indexOf('--vote') + 1] : null;
  const first = await view(bots[0]);
  const phase = first.room.phase;
  for (let guard = 0; guard < 20; guard += 1) {
    for (const bot of bots) {
      const v = await view(bot);
      const me = v.room.players.find((p) => p.id === v.me.playerId);
      if (v.room.phase !== phase) break;
      if (phase === 'REVEAL' || phase === 'DISCUSSION') await act(bot, { type: 'ready' });
      if (phase === 'CLUES' && v.room.currentSpeakerId === v.me.playerId) await act(bot, { type: 'submitClue', text: 'un indice malin' });
      if (phase === 'VOTING' && me.alive && !v.me.myVote) {
        const target = v.room.players.find((p) => p.name === voteName && p.alive && p.id !== me.id) ?? v.room.players.find((p) => p.alive && p.id !== me.id && (!v.room.voting.candidates || v.room.voting.candidates.includes(p.id)));
        if (target) await act(bot, { type: 'vote', targetId: target.id });
      }
    }
    if (phase !== 'CLUES') break;
    const now = await view(bots[0]);
    const human = now.room.players.find((p) => p.id === now.room.currentSpeakerId);
    if (now.room.phase !== 'CLUES' || (human && !bots.some((b) => b.playerId === human.id))) break;
  }
  const after = await view(bots[0]);
  console.log(`phase : ${phase} → ${after.room.phase}`);
  process.exit(0);
}

console.log('commandes : join ROOM N | step [--vote Nom] | status');
