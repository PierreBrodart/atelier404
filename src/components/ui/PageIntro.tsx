import type { ReactNode } from 'react';
import type { AccentName } from '@/data/types';
import { Split } from './Split';

interface PageIntroProps {
  label: string;
  title: string;
  intro: string;
  accent: AccentName;
  /** Élément décoratif ou complémentaire à droite du titre (ex. scène 3D) */
  aside?: ReactNode;
}

/** En-tête de page : grand aplat de la couleur de la page, titre géant, chapeau. */
export function PageIntro({ label, title, intro, accent, aside }: PageIntroProps) {
  return (
    <section className={`page-intro page-intro--${accent}`} aria-labelledby="page-title">
      <div className="container page-intro__inner">
        <div className="page-intro__main">
          <p className="page-intro__label" data-reveal="fade">
            <span className="section-head__dot" aria-hidden="true" />
            {label}
          </p>
          <h1 id="page-title" className="page-intro__title">
            <Split text={title} delay={0.1} />
          </h1>
          <p className="page-intro__text" data-reveal="fade" data-reveal-delay="0.4">
            {intro}
          </p>
        </div>
        {aside}
      </div>
      <span className="page-intro__blob page-intro__blob--a" aria-hidden="true" data-drift="50" />
      <span className="page-intro__blob page-intro__blob--b" aria-hidden="true" data-drift="-40" />
    </section>
  );
}
