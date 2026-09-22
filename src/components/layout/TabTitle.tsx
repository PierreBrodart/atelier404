'use client';

import { useEffect } from 'react';

// Rythme lent et discret : un changement toutes les 1,2 s seulement.
const TICK_MS = 1200;

// Un seul emoji, qui se décale d'une case sur une piste de 3, devant le titre d'origine.
const WALKERS = ['🖥️', '💾', '🕹️'];
const TRACK = 3;

/**
 * Quand l'onglet passe en arrière-plan, son titre s'anime doucement : un emoji fait de petits
 * allers-retours devant le titre habituel (pas de message, pas d'interpellation).
 * Au retour, le titre d'origine est restauré. Avec « réduire les animations », il ne bouge pas.
 * Purement cosmétique : ne rend rien dans la page.
 */
export function TabTitle() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let original = document.title;
    let timer: number | undefined;
    let step = 0;

    const frame = () => {
      const cycle = TRACK * 2 - 2;
      const phase = step % cycle;
      const position = phase < TRACK ? phase : cycle - phase;
      const walker = WALKERS[Math.floor(step / cycle) % WALKERS.length];
      const track = Array.from({ length: TRACK }, (_, i) => (i === position ? walker : '·')).join(' ');
      document.title = `${track} ${original}`;
      step += 1;
    };

    const stop = () => {
      window.clearInterval(timer);
      timer = undefined;
    };

    const onVisibility = () => {
      if (document.hidden) {
        original = document.title;
        step = 0;
        if (reduced.matches) {
          document.title = `${WALKERS[0]} ${original}`;
          return;
        }
        frame();
        timer = window.setInterval(frame, TICK_MS);
      } else {
        stop();
        document.title = original;
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
      if (document.hidden) document.title = original;
    };
  }, []);

  return null;
}
