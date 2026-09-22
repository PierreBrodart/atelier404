import type { AccentName } from '@/data/types';
import { cx } from '@/lib/cx';

interface MarqueeProps {
  items: readonly string[];
  tone?: AccentName;
  className?: string;
}

/**
 * Bandeau défilant. Le CSS gère le mouvement (et le désactive avec « mouvement réduit »).
 * Seul le premier groupe est lu par les lecteurs d'écran, les autres sont des copies décoratives.
 */
export function Marquee({ items, tone = 'sun', className }: MarqueeProps) {
  return (
    <div className={cx('marquee', `marquee--${tone}`, className)}>
      <div className="marquee__track" data-marquee>
        {[false, true, true, true].map((hidden, group) => (
          <ul key={group} className="marquee__group" aria-hidden={hidden || undefined}>
            {items.map((item) => (
              <li key={item} className="marquee__item">
                {item}
                <span className="marquee__star" aria-hidden="true">
                  ✺
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
