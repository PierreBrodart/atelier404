import { processSteps } from '@/data/services';
import { servicesPageContent } from '@/data/home';
import { SectionHead } from '../ui/SectionHead';

/** Déroulé d'un projet en cinq étapes (liste ordonnée). */
export function Process() {
  return (
    <section className="process" aria-labelledby="process-title">
      <div className="container">
        <SectionHead
          id="process-title"
          label={servicesPageContent.process.label}
          title={servicesPageContent.process.title}
        />
        <ol className="process__list" data-reveal="stagger">
          {processSteps.map((step) => (
            <li key={step.number} className="process__step">
              <span className="process__number" aria-hidden="true">
                {step.number}
              </span>
              <h3 className="process__title">{step.title}</h3>
              <p className="process__text">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
