'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { cx } from '@/lib/cx';
import type { SceneName } from './shared';

// Three.js + R3F ne sont téléchargés que lorsqu'une scène approche de l'écran.
const StageCanvas = dynamic(() => import('./StageCanvas'), { ssr: false });

interface LazyStageProps {
  scene: SceneName;
  className?: string;
  color?: string;
  lines?: string[];
}

/**
 * Emplacement d'une scène 3D décorative (masquée aux technologies d'assistance).
 *  - le module 3D est chargé à l'approche du viewport ;
 *  - le rendu est mis en pause dès que la scène sort de l'écran.
 */
export function LazyStage({ scene, className, color, lines }: LazyStageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setMounted(true);
      },
      { rootMargin: '150px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cx('stage', className)} aria-hidden="true">
      {mounted && <StageCanvas scene={scene} active={visible} color={color} lines={lines} />}
    </div>
  );
}
