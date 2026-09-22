import { ScrollTrigger } from '../gsap';
import { initMarquee } from './marquee';
import { initParallax } from './parallax';
import { initReveals } from './reveal';

/**
 * Initialise toutes les animations de la page courante.
 * À appeler dans un contexte `gsap.matchMedia()` : tout est nettoyé automatiquement
 * quand la page change ou quand l'utilisateur active « réduire les animations ».
 */
export function setupMotion(): () => void {
  initReveals();
  initParallax();
  const cleanupMarquee = initMarquee();

  // Les polices et images peuvent décaler la mise en page après coup.
  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener('load', refresh);
  document.fonts?.ready.then(refresh);

  return () => {
    window.removeEventListener('load', refresh);
    cleanupMarquee?.();
  };
}
