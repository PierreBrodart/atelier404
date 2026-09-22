import { gsap } from '../gsap';

/**
 * Révélations au scroll, pilotées par des attributs HTML :
 *   data-reveal="fade" | "words" | "scrub" | "stagger" | "pop" | "mask"
 *   data-reveal-delay="0.2"   (secondes, optionnel)
 * Les états initiaux (masqués) sont définis en CSS sous `.motion-ok`.
 */
export function initReveals() {
  const elements = gsap.utils.toArray<HTMLElement>('[data-reveal]');

  elements.forEach((el) => {
    const type = el.dataset.reveal ?? 'fade';
    const delay = Number(el.dataset.revealDelay ?? 0);
    const scrollTrigger = { trigger: el, start: 'top 88%', once: true };

    switch (type) {
      case 'words':
        gsap.to(el.querySelectorAll('.split__inner'), {
          y: 0,
          duration: 1,
          ease: 'power4.out',
          stagger: 0.07,
          delay,
          scrollTrigger,
          onComplete: () => el.classList.add('is-revealed'),
        });
        break;

      case 'scrub':
        gsap.fromTo(
          el.querySelectorAll('.split__inner'),
          { opacity: 0.16 },
          {
            opacity: 1,
            ease: 'none',
            stagger: 0.12,
            scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 55%', scrub: true },
          },
        );
        break;

      case 'stagger':
        gsap.to(el.children, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          delay,
          scrollTrigger,
        });
        break;

      case 'pop':
        gsap.to(el, {
          opacity: 1,
          scale: 1,
          duration: 0.9,
          ease: 'back.out(2.2)',
          delay,
          scrollTrigger,
        });
        break;

      case 'mask':
        gsap.to(el, {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1.2,
          ease: 'power4.inOut',
          delay,
          scrollTrigger,
        });
        gsap.fromTo(
          el.querySelectorAll('img'),
          { scale: 1.25 },
          { scale: 1, duration: 1.6, ease: 'power3.out', delay, scrollTrigger },
        );
        break;

      default:
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          delay,
          scrollTrigger,
        });
    }
  });
}
