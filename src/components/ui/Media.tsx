import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { ImageAsset } from '@/data/types';
import { cx } from '@/lib/cx';

interface MediaProps {
  image: ImageAsset;
  sizes: string;
  /** Rapport largeur/hauteur du cadre (par défaut : celui de l'image) */
  ratio?: number;
  /** Rapport alternatif sur petit écran (< 768px) */
  ratioSmall?: number;
  /** Amplitude de la parallaxe (0 = aucune) */
  parallax?: number;
  /** Révélation par masque au scroll */
  reveal?: boolean;
  priority?: boolean;
  className?: string;
}

/**
 * Cadre d'image : `next/image` en mode `fill`, révélation par masque (GSAP)
 * et parallaxe optionnelle. L'image est plus haute que son cadre pour laisser
 * la place au mouvement.
 */
export function Media({ image, sizes, ratio, ratioSmall, parallax = 0, reveal = true, priority, className }: MediaProps) {
  return (
    <div
      className={cx('media', className)}
      style={
        {
          '--ratio': ratio ?? image.width / image.height,
          ...(ratioSmall ? { '--ratio-sm': ratioSmall } : {}),
        } as CSSProperties
      }
      data-reveal={reveal ? 'mask' : undefined}
    >
      <div className={cx('media__layer', parallax > 0 && 'media__layer--shifted')} data-speed={parallax || undefined}>
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="media__img"
        />
      </div>
    </div>
  );
}
