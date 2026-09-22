import { mkdir, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { isKahoot, isValidKahootId, type KahootDraft } from './validate';
import { toSummary, type Kahoot, type KahootSummary } from './types';

/**
 * Persistance des Kahoot : un fichier JSON par quiz, écrit sur disque (pas de base de
 * données, voir TECHNICAL.md). Le dossier doit être un volume monté en production
 * (docker-compose.yml) pour survivre aux redéploiements — le processus applicatif lui-même
 * ne fait que le créer s'il manque.
 *
 * Écriture atomique : on écrit dans un fichier temporaire puis on renomme (`rename` est
 * atomique côté OS), pour ne jamais laisser un fichier à moitié écrit si le process
 * s'arrête pendant une sauvegarde.
 */

const DATA_DIR = process.env.KAHOOT_DATA_DIR
  ? path.resolve(process.env.KAHOOT_DATA_DIR)
  : path.join(process.cwd(), 'data', 'kahoot', 'manual');

async function ensureDir(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
}

/** L'id est aussi le nom de fichier : jamais construit sans validation (traversée de chemin). */
function filePath(id: string): string {
  if (!isValidKahootId(id)) throw new Error('Identifiant de Kahoot invalide.');
  return path.join(DATA_DIR, `${id}.json`);
}

export async function listKahoots(): Promise<KahootSummary[]> {
  await ensureDir();
  const entries = await readdir(DATA_DIR).catch(() => [] as string[]);
  const summaries: KahootSummary[] = [];
  for (const entry of entries) {
    if (!entry.endsWith('.json')) continue;
    const kahoot = await getKahoot(entry.slice(0, -'.json'.length));
    if (kahoot) summaries.push(toSummary(kahoot));
  }
  return summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getKahoot(id: string): Promise<Kahoot | null> {
  if (!isValidKahootId(id)) return null;
  try {
    const raw = await readFile(filePath(id), 'utf8');
    const parsed: unknown = JSON.parse(raw);
    return isKahoot(parsed) ? parsed : null;
  } catch {
    // Fichier absent, illisible, ou corrompu : on ignore plutôt que de faire planter la liste.
    return null;
  }
}

async function writeKahoot(kahoot: Kahoot): Promise<void> {
  await ensureDir();
  const target = filePath(kahoot.id);
  const tmp = `${target}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(kahoot, null, 2), 'utf8');
  await rename(tmp, target);
}

export async function createKahoot(draft: KahootDraft): Promise<Kahoot> {
  const now = new Date().toISOString();
  const kahoot: Kahoot = { id: randomUUID(), type: 'manual', createdAt: now, updatedAt: now, ...draft };
  await writeKahoot(kahoot);
  return kahoot;
}

export async function updateKahoot(id: string, draft: KahootDraft): Promise<Kahoot | null> {
  const existing = await getKahoot(id);
  if (!existing) return null;
  const kahoot: Kahoot = { ...existing, ...draft, updatedAt: new Date().toISOString() };
  await writeKahoot(kahoot);
  return kahoot;
}

export async function duplicateKahoot(id: string): Promise<Kahoot | null> {
  const existing = await getKahoot(id);
  if (!existing) return null;
  const now = new Date().toISOString();
  const copy: Kahoot = {
    ...existing,
    id: randomUUID(),
    title: `${existing.title} (copie)`,
    createdAt: now,
    updatedAt: now,
    questions: existing.questions.map((question) => ({ ...question })),
  };
  await writeKahoot(copy);
  return copy;
}

export async function deleteKahoot(id: string): Promise<boolean> {
  if (!isValidKahootId(id)) return false;
  try {
    await unlink(filePath(id));
    return true;
  } catch {
    return false;
  }
}
