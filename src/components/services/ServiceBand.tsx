import type { CSSProperties } from 'react';
import type { Service } from '@/data/types';
import { accentVar, onAccentVar } from '@/lib/accent';
import { Split } from '../ui/Split';

/** Bande colorée d'un service (page /services). L'`id` permet les liens directs depuis l'accueil. */
export function ServiceBand({ service }: { service: Service }) {
  const style = { '--band-bg': accentVar(service.accent), '--band-fg': onAccentVar(service.accent) } as CSSProperties;

  return (
    <section id={service.slug} className="service-band" style={style} aria-labelledby={`${service.slug}-title`}>
      <p className="service-band__ghost" aria-hidden="true" data-drift="70">
        {service.number}
      </p>
      <div className="container service-band__inner">
        <div className="service-band__head">
          <p className="service-band__number" data-reveal="fade">
            Service {service.number}
          </p>
          <Split as="h2" id={`${service.slug}-title`} text={service.name} className="service-band__title" />
          <p className="service-band__tagline" data-reveal="fade">
            {service.tagline}
          </p>
        </div>

        <div className="service-band__body" data-reveal="fade">
          <p className="service-band__desc">{service.description}</p>
          <h3 className="service-band__sub">Ce que vous recevez</h3>
          <ul className="service-band__list">
            {service.deliverables.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3 className="service-band__sub">Avec quoi</h3>
          <ul className="tags tags--band">
            {service.stack.map((tech) => (
              <li key={tech} className="tag">
                {tech}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
