import { NextResponse } from 'next/server';
import { isValidEditorKey } from '@/lib/kahoot/editorSlug';
import { duplicateKahoot } from '@/lib/kahoot/store';
import { isValidKahootId } from '@/lib/kahoot/validate';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const bad = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

/** POST : duplique un Kahoot existant (« Titre (copie) »). Réservée à l'éditeur. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isValidEditorKey(request.headers.get('x-kahoot-key'))) return bad('Accès refusé.', 403);
  const { id } = await params;
  if (!isValidKahootId(id)) return bad('Identifiant invalide.');

  const kahoot = await duplicateKahoot(id);
  return kahoot ? NextResponse.json({ ok: true, kahoot }) : bad('Ce Kahoot n’existe pas.', 404);
}
