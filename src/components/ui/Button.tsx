import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { TLink } from '../layout/PageTransition';

type Variant = 'primary' | 'ink' | 'ghost';

interface CommonProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

const content = (children: ReactNode) => (
  <>
    <span className="roll">
      <span className="roll__a">{children}</span>
      <span className="roll__b" aria-hidden="true">
        {children}
      </span>
    </span>
    <span className="btn__arrow" aria-hidden="true">
      →
    </span>
  </>
);

/** Lien stylé en bouton. Lien interne (transition) ou externe / mailto selon `href`. */
export function ButtonLink({ href, variant = 'primary', className, children }: CommonProps & { href: string }) {
  const classes = cx('btn', `btn--${variant}`, className);
  const internal = href.startsWith('/');
  return internal ? (
    <TLink href={href} className={classes}>
      {content(children)}
    </TLink>
  ) : (
    <a href={href} className={classes}>
      {content(children)}
    </a>
  );
}

/** Vrai `<button>` (formulaires). */
export function Button({
  variant = 'primary',
  className,
  children,
  ...props
}: CommonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>) {
  return (
    <button className={cx('btn', `btn--${variant}`, className)} {...props}>
      {content(children)}
    </button>
  );
}
