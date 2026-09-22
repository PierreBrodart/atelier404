'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Project } from '@/data/types';
import { gsap } from '@/lib/gsap';
import { TLink } from '../layout/PageTransition';

/**
 * Index typographique des projets. Au survol (ou au focus clavier), un aperçu
 * flottant suit le curseur et la ligne prend la couleur du projet.
 * Sur mobile / tactile, une vignette est affichée dans chaque ligne.
 */
export function ProjectIndex({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<number | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const preview = previewRef.current;
    if (!media.matches || !preview) return;

    const moveX = gsap.quickTo(preview, 'x', { duration: 0.5, ease: 'power3' });
    const moveY = gsap.quickTo(preview, 'y', { duration: 0.5, ease: 'power3' });
    const rotate = gsap.quickTo(preview, 'rotation', { duration: 0.6, ease: 'power3' });
    let lastX = 0;

    const onMove = (event: PointerEvent) => {
      moveX(event.clientX);
      moveY(event.clientY);
      rotate(gsap.utils.clamp(-14, 14, (event.clientX - lastX) * 0.6));
      lastX = event.clientX;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <>
      <ul className="pindex">
        {projects.map((project, index) => (
          <li
            key={project.slug}
            className="pindex__row"
            style={{ '--row-bg': project.theme.background, '--row-fg': project.theme.foreground } as CSSProperties}
            data-reveal="fade"
          >
            <TLink
              href={`/projets/${project.slug}`}
              className="pindex__link"
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
            >
              <span className="pindex__year">{project.year}</span>
              <span className="pindex__name">{project.name}</span>
              <span className="pindex__cat">{project.category}</span>
              <span className="pindex__thumb">
                <Image src={project.cover.src} alt="" fill sizes="120px" className="pindex__thumb-img" />
              </span>
              <span className="pindex__arrow" aria-hidden="true">
                ↗
              </span>
            </TLink>
          </li>
        ))}
      </ul>

      <div ref={previewRef} className="pindex__preview" data-visible={active !== null} aria-hidden="true">
        {projects.map((project, index) => (
          <div key={project.slug} className="pindex__preview-item" data-on={index === active}>
            <Image src={project.cover.src} alt="" fill sizes="360px" className="pindex__preview-img" />
          </div>
        ))}
      </div>
    </>
  );
}
