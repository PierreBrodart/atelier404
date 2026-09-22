'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { gsap } from '@/lib/gsap';
import { setupMotion } from '@/lib/motion';

const REDUCED = '(prefers-reduced-motion: reduce)';

/**
 * Point d'entrée des animations. Ne rend rien.
 *  - `html.motion-ok` autorise les états initiaux « masqués » du CSS (révélations) ;
 *  - les animations sont créées dans `gsap.matchMedia()` : elles disparaissent
 *    si l'utilisateur demande une réduction des animations ;
 *  - tout est reconstruit à chaque changement de page.
 */
export function MotionProvider() {
  const pathname = usePathname();

  // Synchronise la classe avec la préférence système (y compris en cours de visite).
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia(REDUCED);
    const sync = () => root.classList.toggle('motion-ok', !media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    let cancelled = false;
    let mm: gsap.MatchMedia | undefined;

    const start = () => {
      if (cancelled) return;
      mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => setupMotion());
      root.classList.add('motion-ready');
    };

    // Pendant une transition, on attend que le rideau se soit levé.
    if (root.dataset.covering === 'true') {
      window.addEventListener('a404:uncover', start, { once: true });
    } else {
      start();
    }

    return () => {
      cancelled = true;
      window.removeEventListener('a404:uncover', start);
      mm?.revert();
    };
  }, [pathname]);

  return null;
}
