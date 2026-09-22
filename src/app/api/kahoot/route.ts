import { NextResponse } from 'next/server';
import { isValidEditorKey } from '@/lib/kahoot/editorSlug';
import { createKahoot, listKahoots } from '@/lib/kahoot/store';
import { parseKahootDraft } from '@/lib/kahoot/validate';

// Toujours dynamique : la liste reflète les fichiers JSON présents sur disque à l'instant T.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BODY_BYTES = 200_000;

const bad = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

/** GET : liste publique (résumés). Utilisée par la page /kahoot et par le tableau de bord secret. */
export async function GET() {
  return NextResponse.json({ ok: true, kahoots: await listKahoots() });
}

/** POST : création. Réservée à l'éditeur (clé attendue dans l'en-tête `x-kahoot-key`). */
export async function POST(request: Request) {
  if (!isValidEditorKey(request.headers.get('x-kahoot-key'))) return bad('Accès refusé.', 403);

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

  const kahoot = await createKahoot(draft);
  return NextResponse.json({ ok: true, kahoot });
}
