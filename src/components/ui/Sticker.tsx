import type { CSSProperties, ReactNode } from 'react';
import type { AccentName } from '@/data/types';
import { cx } from '@/lib/cx';

interface StickerProps {
  children: ReactNode;
  tone?: AccentName;
  /** Rotation au repos, en degrés */
  tilt?: number;
  className?: string;
}

/** Autocollant décalé. Purement décoratif : ne porte jamais d'information essentielle. */
export function Sticker({ children, tone = 'sun', tilt = -6, className }: StickerProps) {
  return (
    <span
      className={cx('sticker', `sticker--${tone}`, className)}
      style={{ '--tilt': `${tilt}deg` } as CSSProperties}
      data-reveal="pop"
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

/** Pastille ronde au texte circulaire, qui tourne lentement (CSS). */
export function RotatingBadge({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cx('badge', className)} data-reveal="pop" aria-hidden="true">
      <svg viewBox="0 0 120 120" className="badge__ring">
        <defs>
          <path id="badge-circle" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
        </defs>
        <text>
          <textPath href="#badge-circle" startOffset="0" textLength="284" lengthAdjust="spacing">
            {text.toUpperCase()}
          </textPath>
        </text>
      </svg>
      <span className="badge__core">404</span>
    </span>
  );
}
