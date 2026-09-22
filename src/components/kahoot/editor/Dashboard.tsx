'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { deleteKahoot, duplicateKahoot } from '@/lib/kahoot/client';
import type { KahootSummary } from '@/lib/kahoot/types';
import { KahootCard } from '../KahootCard';

function RowActions({ editorKey, kahoot }: { editorKey: string; kahoot: KahootSummary }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const duplicate = async () => {
    setBusy(true);
    setError(null);
    const result = await duplicateKahoot(editorKey, kahoot.id);
    setBusy(false);
    if (!result.ok) setError(result.error);
    else router.refresh();
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    const result = await deleteKahoot(editorKey, kahoot.id);
    setBusy(false);
    if (!result.ok) setError(result.error);
    else router.refresh();
  };

  return (
    <>
      <ButtonLink href={`/kahoot/${editorKey}/${kahoot.id}`} variant="ink">
        Modifier
      </ButtonLink>
      <button type="button" className="kh-link-button" onClick={duplicate} disabled={busy}>
        Dupliquer
      </button>
      {confirming ? (
        <>
          <button type="button" className="kh-link-button" onClick={remove} disabled={busy}>
            Confirmer la suppression
          </button>
          <button type="button" className="kh-link-button" onClick={() => setConfirming(false)} disabled={busy}>
            Annuler
          </button>
        </>
      ) : (
        <button type="button" className="kh-link-button" onClick={() => setConfirming(true)} disabled={busy}>
          Supprimer
        </button>
      )}
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

export function Dashboard({ editorKey, kahoots }: { editorKey: string; kahoots: KahootSummary[] }) {
  return (
    <div className="kh-dashboard">
      <header className="kh-dashboard__head">
        <div>
          <h1 className="kh-title">Tableau de bord Kahoot</h1>
          <p className="kh-hint">
            Cette page n’est pas référencée : garde son adresse pour toi. {kahoots.length} Kahoot{kahoots.length > 1 ? 's' : ''}.
          </p>
        </div>
        <ButtonLink href={`/kahoot/${editorKey}/nouveau`}>Nouveau Kahoot</ButtonLink>
      </header>

      {kahoots.length === 0 ? (
        <p className="kh-empty">Aucun Kahoot pour l’instant — commence par en créer un.</p>
      ) : (
        <div className="kh-grid">
          {kahoots.map((kahoot) => (
            <KahootCard key={kahoot.id} kahoot={kahoot} actions={<RowActions editorKey={editorKey} kahoot={kahoot} />} />
          ))}
        </div>
      )}
    </div>
  );
}
