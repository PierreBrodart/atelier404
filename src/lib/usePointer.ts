'use client';

import { useEffect, useRef } from 'react';

/**
 * Position du curseur normalisée (-1 → 1) par rapport à la fenêtre.
 * Retourne une ref (pas de re-render) lue dans les boucles d'animation.
 * Ne fait rien sur écran tactile.
 */
export function usePointer() {
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return pointer;
}
