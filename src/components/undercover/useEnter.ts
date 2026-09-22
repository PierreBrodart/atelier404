'use client';

import { useLayoutEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';

/**
 * Animation d'entrée d'un écran de jeu (même langage que le reste du site) :
 * les mots du titre (`.split__inner`) montent un à un, puis les blocs marqués
 * `data-enter` apparaissent en cascade. Rejoué à chaque changement de `key`.
 * Désactivé avec `prefers-reduced-motion` : le contenu est alors simplement affiché.
 */
export function useEnter<T extends HTMLElement>(key: string | number) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const words = root.querySelectorAll('.split__inner');
      const items = root.querySelectorAll('[data-enter]');
      gsap.fromTo(
        words,
        { yPercent: 110, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.8, ease: 'power4.out', stagger: 0.06, clearProps: 'transform,opacity' },
      );
      gsap.fromTo(
        items,
        { y: 30, opacity: 0, rotate: -1.2 },
        {
          y: 0,
          opacity: 1,
          rotate: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.07,
          delay: 0.15,
          clearProps: 'transform,opacity',
        },
      );
    });
    return () => mm.revert();
  }, [key]);

  return ref;
}
