'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { homeContent } from '@/data/home';
import type { Service } from '@/data/types';
import { accentHex, accentVar, onAccentVar } from '@/lib/accent';
import { TLink } from '../layout/PageTransition';
import { LazyStage } from '../three/LazyStage';
import { SectionHead } from '../ui/SectionHead';

/**
 * Index des services : la couleur de la section (et de la disquette 3D) suit la ligne
 * survolée, focalisée au clavier, ou — sur écran tactile — centrée à l'écran.
 * Toutes les informations restent visibles en permanence : le survol n'est qu'un plus.
 */
export function ServiceIndex({ services }: { services: Service[] }) {
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);
  const current = services[active];

  useEffect(() => {
    if (!window.matchMedia('(hover: none)').matches) return;
    const rows = listRef.current?.querySelectorAll<HTMLElement>('[data-index]');
    if (!rows) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        });
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    rows.forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  }, []);

  const style = {
    '--sx-bg': accentVar(current.accent),
    '--sx-fg': onAccentVar(current.accent),
  } as CSSProperties;

  return (
    <section className="service-index" style={style} aria-labelledby="services-title">
      <div className="container service-index__grid">
        <div className="service-index__intro">
          <SectionHead id="services-title" label={homeContent.services.label} title={homeContent.services.title} />
          <LazyStage scene="floppy" color={accentHex[current.accent]} className="service-index__stage" />
        </div>

        <ol ref={listRef} className="service-index__list">
          {services.map((service, index) => (
            <li
              key={service.slug}
              className="service-row"
              data-index={index}
              data-active={index === active}
              data-reveal="fade"
            >
              <TLink
                href={`/services#${service.slug}`}
                className="service-row__link"
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
              >
                <span className="service-row__number">{service.number}</span>
                <span className="service-row__text">
                  <span className="service-row__name">{service.name}</span>
                  <span className="service-row__tagline">{service.tagline}</span>
                </span>
                <span className="service-row__arrow" aria-hidden="true">
                  →
                </span>
              </TLink>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
