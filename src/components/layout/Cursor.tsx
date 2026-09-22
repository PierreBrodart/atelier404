'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';

const INTERACTIVE = 'a, button, summary, input, select, textarea, label, [role="button"]';

/**
 * Pastille qui suit le curseur (souris uniquement, jamais avec « réduire les animations »).
 * Le curseur système reste visible : la pastille est purement décorative.
 * Un élément avec `data-cursor="Voir"` y affiche son libellé.
 */
export function Cursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const media = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)');
    const cursor = cursorRef.current;
    const label = labelRef.current;
    if (!media.matches || !cursor || !label) return;

    const moveX = gsap.quickTo(cursor, 'x', { duration: 0.4, ease: 'power3' });
    const moveY = gsap.quickTo(cursor, 'y', { duration: 0.4, ease: 'power3' });

    const onMove = (event: PointerEvent) => {
      moveX(event.clientX);
      moveY(event.clientY);
      cursor.dataset.visible = 'true';
    };

    const onOver = (event: PointerEvent) => {
      const element = event.target as HTMLElement | null;
      const labelled = element?.closest<HTMLElement>('[data-cursor]');
      if (labelled) {
        label.textContent = labelled.dataset.cursor ?? '';
        cursor.dataset.state = 'label';
      } else {
        cursor.dataset.state = element?.closest(INTERACTIVE) ? 'link' : 'idle';
      }
    };

    const onLeave = () => {
      cursor.dataset.visible = 'false';
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div ref={cursorRef} className="cursor" data-state="idle" data-visible="false" aria-hidden="true">
      <span className="cursor__dot">
        <span ref={labelRef} className="cursor__label" />
      </span>
    </div>
  );
}
