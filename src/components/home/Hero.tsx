import { homeContent } from '@/data/home';
import { LazyStage } from '../three/LazyStage';
import { ButtonLink } from '../ui/Button';
import { Split } from '../ui/Split';
import { RotatingBadge, Sticker } from '../ui/Sticker';

const { hero } = homeContent;

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__inner container">
        <p className="hero__eyebrow" data-reveal="fade">
          <span className="hero__dot" aria-hidden="true" />
          {hero.eyebrow}
        </p>

        <h1 id="hero-title" className="hero__title">
          <Split text={hero.title} delay={0.15} />
        </h1>

        <div className="hero__stage" data-reveal="pop" data-reveal-delay="0.3">
          <LazyStage scene="crt" className="hero__crt" />
        </div>
        <RotatingBadge text="Fait main à Troyes • 100 % artisanal • " className="hero__badge" />
        <Sticker tone="sun" tilt={7} className="hero__sticker">
          v2.0.4-beta
        </Sticker>
        <Sticker tone="mint" tilt={-9} className="hero__sticker hero__sticker--alt">
          zéro template
        </Sticker>

        <div className="hero__foot">
          <p className="hero__intro" data-reveal="fade" data-reveal-delay="0.5">
            {hero.intro}
          </p>
          <div className="hero__cta" data-reveal="fade" data-reveal-delay="0.65">
            <ButtonLink href={hero.primaryCta.href}>{hero.primaryCta.label}</ButtonLink>
            <ButtonLink href={hero.secondaryCta.href} variant="ghost">
              {hero.secondaryCta.label}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
