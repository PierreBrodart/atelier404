import type { AccentName } from '@/data/types';
import { homeContent } from '@/data/home';
import { ButtonLink } from './Button';
import { Split } from './Split';
import { RotatingBadge } from './Sticker';

interface CtaBandProps {
  tone?: AccentName;
  title?: string;
  text?: string;
}

/** Grand bandeau d'appel à l'action, placé avant le pied de page. */
export function CtaBand({ tone = 'tomato', title = homeContent.cta.title, text = homeContent.cta.text }: CtaBandProps) {
  return (
    <section className={`cta cta--${tone}`} aria-labelledby="cta-title">
      <div className="container cta__inner">
        <Split as="h2" id="cta-title" text={title} className="cta__title" />
        <div className="cta__side" data-reveal="fade">
          <p className="cta__text">{text}</p>
          <ButtonLink href="/contact" variant="ink">
            {homeContent.cta.label}
          </ButtonLink>
        </div>
        <RotatingBadge text="Réponse sous 48 h • Café offert • " className="cta__badge" />
      </div>
    </section>
  );
}
