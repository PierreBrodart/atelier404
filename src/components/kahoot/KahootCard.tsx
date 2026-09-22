import type { CSSProperties, ReactNode } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { accentVar, onAccentVar } from '@/lib/accent';
import type { KahootSummary } from '@/lib/kahoot/types';

export function KahootCard({ kahoot, actions }: { kahoot: KahootSummary; actions?: ReactNode }) {
  const date = new Date(kahoot.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <article
      className="kh-card"
      style={{ '--card-bg': accentVar(kahoot.accent), '--card-fg': onAccentVar(kahoot.accent) } as CSSProperties}
    >
      <div className="kh-card__frame">
        <p className="kh-card__meta">
          {kahoot.questionCount} question{kahoot.questionCount > 1 ? 's' : ''} · {date}
        </p>
        <h3 className="kh-card__title">{kahoot.title}</h3>
        {kahoot.description && <p className="kh-card__desc">{kahoot.description}</p>}
        <div className="kh-card__actions">
          <ButtonLink href={`/kahoot/jouer/${kahoot.id}`}>Jouer</ButtonLink>
          {actions}
        </div>
      </div>
    </article>
  );
}
