import { cx } from '@/lib/cx';
import { Split } from './Split';

interface SectionHeadProps {
  label: string;
  title: string;
  /** Niveau du titre (h2 par défaut ; h1 réservé aux en-têtes de page) */
  as?: 'h1' | 'h2';
  className?: string;
  id?: string;
}

/** Étiquette mono + gros titre animé, utilisés en tête de section. */
export function SectionHead({ label, title, as = 'h2', className, id }: SectionHeadProps) {
  return (
    <div className={cx('section-head', className)}>
      <p className="section-head__label" data-reveal="fade">
        <span className="section-head__dot" aria-hidden="true" />
        {label}
      </p>
      <Split as={as} id={id} text={title} className="section-head__title" />
    </div>
  );
}
