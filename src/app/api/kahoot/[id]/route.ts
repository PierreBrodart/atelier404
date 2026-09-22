import { NextResponse } from 'next/server';
import { isValidEditorKey } from '@/lib/kahoot/editorSlug';
import { deleteKahoot, getKahoot, updateKahoot } from '@/lib/kahoot/store';
import { isValidKahootId, parseKahootDraft } from '@/lib/kahoot/validate';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BODY_BYTES = 200_000;

const bad = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

type Params = { params: Promise<{ id: string }> };

/** GET : Kahoot complet (y compris les bonnes réponses — pas d'adversaire réseau en jeu local). */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!isValidKahootId(id)) return bad('Identifiant invalide.');
  const kahoot = await getKahoot(id);
  return kahoot ? NextResponse.json({ ok: true, kahoot }) : bad('Ce Kahoot n’existe pas.', 404);
}

/** PUT : mise à jour complète. Réservée à l'éditeur. */
export async function PUT(request: Request, { params }: Params) {
  if (!isValidEditorKey(request.headers.get('x-kahoot-key'))) return bad('Accès refusé.', 403);
  const { id } = await params;
  if (!isValidKahootId(id)) return bad('Identifiant invalide.');

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return bad('Requête trop volumineuse.', 413);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return bad('JSON invalide.');
  }

  const draft = parseKahootDraft(body);
  if (!draft) return bad('Kahoot invalide : vérifie le titre, les questions et leurs réponses.');

  const kahoot = await updateKahoot(id, draft);
  return kahoot ? NextResponse.json({ ok: true, kahoot }) : bad('Ce Kahoot n’existe pas.', 404);
}

/** DELETE : suppression définitive. Réservée à l'éditeur. */
export async function DELETE(request: Request, { params }: Params) {
  if (!isValidEditorKey(request.headers.get('x-kahoot-key'))) return bad('Accès refusé.', 403);
  const { id } = await params;
  if (!isValidKahootId(id)) return bad('Identifiant invalide.');

  const removed = await deleteKahoot(id);
  return removed ? NextResponse.json({ ok: true }) : bad('Ce Kahoot n’existe pas.', 404);
}
