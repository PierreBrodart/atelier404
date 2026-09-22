'use client';

import { BASE_PATH } from '@/lib/basePath';
import type { Kahoot, KahootSummary } from './types';
import type { KahootDraft } from './validate';

type ApiResult<T> = ({ ok: true } & T) | { ok: false; error: string };

async function request<T = Record<string, never>>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${BASE_PATH}/api/kahoot${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
    const data = (await response.json()) as { ok: boolean; error?: string } & T;
    if (response.ok && data.ok) return data as { ok: true } & T;
    return { ok: false, error: data.error ?? 'Une erreur est survenue.' };
  } catch {
    return { ok: false, error: 'Impossible de joindre le serveur. Vérifie ta connexion.' };
  }
}

export const listKahoots = () => request<{ kahoots: KahootSummary[] }>('');

export const fetchKahoot = (id: string) => request<{ kahoot: Kahoot }>(`/${encodeURIComponent(id)}`);

export const createKahoot = (key: string, draft: KahootDraft) =>
  request<{ kahoot: Kahoot }>('', { method: 'POST', headers: { 'x-kahoot-key': key }, body: JSON.stringify(draft) });

export const updateKahoot = (key: string, id: string, draft: KahootDraft) =>
  request<{ kahoot: Kahoot }>(`/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'x-kahoot-key': key },
    body: JSON.stringify(draft),
  });

export const deleteKahoot = (key: string, id: string) =>
  request(`/${encodeURIComponent(id)}`, { method: 'DELETE', headers: { 'x-kahoot-key': key } });

export const duplicateKahoot = (key: string, id: string) =>
  request<{ kahoot: Kahoot }>(`/${encodeURIComponent(id)}/duplicate`, { method: 'POST', headers: { 'x-kahoot-key': key } });
