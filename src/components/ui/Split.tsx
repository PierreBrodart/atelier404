import { Fragment } from 'react';
import { cx } from '@/lib/cx';

interface SplitProps {
  /** Texte à découper. `*mot*` met un mot en valeur. */
  text: string;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3';
  className?: string;
  /** `words` : les mots montent un à un ; `scrub` : ils s'allument au scroll ; `null` : statique. */
  reveal?: 'words' | 'scrub' | null;
  delay?: number;
  id?: string;
}

const EMPHASIS = /^(\W*)\*(.+)\*(\W*)$/;

/**
 * Découpe un texte en mots (Server Component) pour les animations de titres.
 * Les espaces restent de vrais espaces : le texte est lu normalement
 * par les lecteurs d'écran, et reste visible sans JavaScript.
 */
export function Split({ text, as: Tag = 'span', className, reveal = 'words', delay, id }: SplitProps) {
  const tokens = text.split(' ');

  return (
    <Tag id={id} className={cx('split', className)} data-reveal={reveal ?? undefined} data-reveal-delay={delay}>
      {tokens.map((token, index) => {
        const match = token.match(EMPHASIS);
        const [before, word, after] = match ? [match[1], match[2], match[3]] : ['', token, ''];
        return (
          <Fragment key={index}>
            {before}
            <span className={cx('split__word', match && 'split__word--em')}>
              <span className="split__inner">{word}</span>
            </span>
            {after}
            {index < tokens.length - 1 ? ' ' : null}
          </Fragment>
        );
      })}
    </Tag>
  );
}
