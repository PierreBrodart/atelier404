'use client';

import { useState } from 'react';
import type { KahootSummary } from '@/lib/kahoot/types';
import { KahootCard } from './KahootCard';

type Tab = 'mine' | 'news';

/** Page publique /kahoot : deux onglets, « Actualités » n'est qu'une vitrine pour l'instant. */
export function Hub({ kahoots }: { kahoots: KahootSummary[] }) {
  const [tab, setTab] = useState<Tab>('mine');

  return (
    <div className="kh-hub">
      <div className="kh-tabs" role="tablist" aria-label="Sections Kahoot">
        <button type="button" role="tab" aria-selected={tab === 'mine'} className="kh-tab" onClick={() => setTab('mine')}>
          Mes Kahoot
        </button>
        <button type="button" role="tab" aria-selected={tab === 'news'} className="kh-tab" onClick={() => setTab('news')}>
          Actualités
        </button>
      </div>

      {tab === 'mine' && (
        <div role="tabpanel">
          {kahoots.length === 0 ? (
            <p className="kh-empty">Aucun Kahoot publié pour l’instant. Reviens bientôt !</p>
          ) : (
            <div className="kh-grid">
              {kahoots.map((kahoot) => (
                <KahootCard key={kahoot.id} kahoot={kahoot} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'news' && (
        <div role="tabpanel" className="kh-soon">
          <p className="kh-soon__badge" aria-hidden="true">
            Bientôt
          </p>
          <p>
            Cette section accueillera des Kahoot générés automatiquement à partir de l’actualité. En construction — repasse
            plus tard !
          </p>
        </div>
      )}
    </div>
  );
}
