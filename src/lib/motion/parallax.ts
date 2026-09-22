import { gsap } from '../gsap';

/**
 * Parallaxe légère.
 *   data-speed="0.12"  : image (élément absolu plus grand que son parent) qui coulisse
 *   data-drift="60"    : décor qui dérive de ±60px pendant que la section défile
 */
export function initParallax() {
  gsap.utils.toArray<HTMLElement>('[data-speed]').forEach((el) => {
    const speed = Number(el.dataset.speed);
    gsap.fromTo(
      el,
      { yPercent: -speed * 50 },
      {
        yPercent: speed * 50,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });

  gsap.utils.toArray<HTMLElement>('[data-drift]').forEach((el) => {
    const amount = Number(el.dataset.drift);
    gsap.fromTo(
      el,
      { y: -amount },
      {
        y: amount,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });
}
