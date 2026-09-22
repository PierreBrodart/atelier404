import type { Metadata } from 'next';
import { LazyStage } from '@/components/three/LazyStage';
import { ButtonLink } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Page introuvable',
  robots: { index: false },
};

const SCREEN = ['page', 'introuvable'];

/** Le seul endroit où le « 404 » est pris au pied de la lettre. */
export default function NotFound() {
  return (
    <div className="page" data-accent="tomato">
      <section className="not-found" aria-labelledby="nf-title">
        <div className="container not-found__inner">
          <div className="not-found__text">
            <p className="not-found__code">Erreur 404</p>
            <h1 id="nf-title" className="not-found__title">
              Cette page est introuvable. Nous, on est plutôt spécialistes.
            </h1>
            <p className="not-found__desc">
              Elle a déménagé, elle n’a jamais existé, ou quelqu’un a débranché le mauvais câble. Retour à un endroit
              qui existe vraiment ?
            </p>
            <div className="not-found__cta">
              <ButtonLink href="/">Retour à l’accueil</ButtonLink>
              <ButtonLink href="/projets" variant="ghost">
                Voir les projets
              </ButtonLink>
            </div>
          </div>
          <LazyStage scene="crt" color="#FF4A2E" lines={SCREEN} className="not-found__stage" />
        </div>
      </section>
    </div>
  );
}
