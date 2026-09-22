import { NextResponse } from 'next/server';
import { parseAction, parseCode, parseName } from '@/lib/undercover/parse';
import { createRoomForHost, joinRoom, peekRoom, runAction } from '@/lib/undercover/store';

// Toujours dynamique et exécuté par Node : l'état des rooms vit en mémoire dans le processus.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BODY_BYTES = 4_000;

const bad = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

/**
 * POST /api/undercover
 *  { type: 'create', name }                     → crée une room, retourne { code, playerId, token }
 *  { type: 'join', code, name }                 → rejoint une room
 *  { type: 'peek', code }                       → infos publiques d'une room (avant de rejoindre)
 *  { type: 'action', code, token, action }      → action d'un joueur authentifié
 */
export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return bad('Requête trop volumineuse.', 413);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return bad('JSON invalide.');
  }
  if (typeof body !== 'object' || body === null) return bad('Requête invalide.');
  const input = body as Record<string, unknown>;

  switch (input.type) {
    case 'create': {
      const name = parseName(input.name);
      if (!name) return bad('Choisis un prénom de 2 à 16 caractères.');
      const created = createRoomForHost(name);
      return 'error' in created ? bad(created.error, 503) : NextResponse.json({ ok: true, ...created });
    }

    case 'join': {
      const code = parseCode(input.code);
      const name = parseName(input.name);
      if (!code) return bad('Le code de la room contient 5 caractères.');
      if (!name) return bad('Choisis un prénom de 2 à 16 caractères.');
      const joined = joinRoom(code, name);
      return 'error' in joined ? bad(joined.error, joined.status) : NextResponse.json({ ok: true, ...joined });
    }

    case 'peek': {
      const code = parseCode(input.code);
      if (!code) return bad('Le code de la room contient 5 caractères.');
      return NextResponse.json({ ok: true, ...peekRoom(code) });
    }

    case 'action': {
      const code = parseCode(input.code);
      const action = parseAction(input.action);
      if (!code || typeof input.token !== 'string' || !action) return bad('Action invalide.');
      const result = runAction(code, input.token, action);
      if (!result) return bad('Session expirée : rejoins la room.', 401);
      return result.ok ? NextResponse.json({ ok: true }) : bad(result.error, 409);
    }

    default:
      return bad('Type de requête inconnu.');
  }
}
