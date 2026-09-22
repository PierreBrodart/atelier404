import { homeContent } from '@/data/home';
import { Split } from '../ui/Split';

const { manifesto } = homeContent;

/** Grand paragraphe dont les mots « s'allument » au fil du scroll. */
export function Manifesto() {
  return (
    <section className="manifesto" aria-labelledby="manifesto-label">
      <div className="container manifesto__inner">
        <p id="manifesto-label" className="section-head__label" data-reveal="fade">
          <span className="section-head__dot" aria-hidden="true" />
          {manifesto.label}
        </p>
        <Split as="p" text={manifesto.text} reveal="scrub" className="manifesto__text" />
        <dl className="manifesto__facts" data-reveal="stagger">
          {manifesto.facts.map((fact) => (
            <div key={fact.label} className="manifesto__fact">
              <dt className="manifesto__label">{fact.label}</dt>
              <dd className="manifesto__value">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
