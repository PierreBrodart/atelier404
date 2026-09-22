import { gsap, ScrollTrigger } from '../gsap';

/**
 * Les bandeaux défilent en CSS ; ici on accélère simplement leur lecture
 * en fonction de la vitesse de scroll (Web Animations API, aucun re-layout).
 */
export function initMarquee(): (() => void) | undefined {
  const tracks = gsap.utils.toArray<HTMLElement>('[data-marquee]');
  const animations = tracks.flatMap((track) => track.getAnimations());
  if (!animations.length) return;

  let rate = 1;
  let target = 1;

  const trigger = ScrollTrigger.create({
    onUpdate: (self) => {
      target = 1 + Math.min(Math.abs(self.getVelocity()) / 220, 7);
    },
  });

  const tick = () => {
    target += (1 - target) * 0.04;
    rate += (target - rate) * 0.08;
    animations.forEach((animation) => {
      animation.playbackRate = rate;
    });
  };
  gsap.ticker.add(tick);

  return () => {
    gsap.ticker.remove(tick);
    trigger.kill();
    animations.forEach((animation) => {
      animation.playbackRate = 1;
    });
  };
}
