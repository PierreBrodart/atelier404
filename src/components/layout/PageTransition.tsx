'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useRef, type ComponentProps, type ReactNode } from 'react';
import { BASE_PATH } from '@/lib/basePath';
import { gsap } from '@/lib/gsap';
import { getRouteMeta } from '@/lib/routes';
import { prefersReducedMotion } from '@/lib/useReducedMotion';

interface TransitionApi {
  /** Lance la transition. Retourne false si le lien doit être suivi normalement. */
  go: (href: string) => boolean;
}

const TransitionContext = createContext<TransitionApi | null>(null);

const pathOf = (href: string) => href.split(/[?#]/)[0].replace(/\/$/, '') || '/';

/**
 * Rideau de couleur entre deux pages. La couleur et le mot affiché
 * viennent de la destination (voir `getRouteMeta`). Sans JS ou avec
 * « réduire les animations », les liens fonctionnent normalement.
 */
export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const busy = useRef(false);
  const failsafe = useRef<number | undefined>(undefined);

  const uncover = useCallback(() => {
    if (!busy.current) return;
    window.clearTimeout(failsafe.current);
    const root = document.documentElement;

    gsap
      .timeline({
        onComplete: () => {
          gsap.set(overlayRef.current, { visibility: 'hidden', pointerEvents: 'none' });
          busy.current = false;
        },
      })
      .to(labelRef.current, { yPercent: -130, duration: 0.45, ease: 'power3.in' })
      .to(panelRef.current, { yPercent: -100, duration: 0.75, ease: 'power4.inOut' }, '<0.1')
      .call(
        () => {
          delete root.dataset.covering;
          window.dispatchEvent(new Event('a404:uncover'));
          document.getElementById('main')?.focus({ preventScroll: true });
        },
        undefined,
        0.35,
      );
  }, []);

  // La nouvelle page est rendue : on la remet tout en haut (sous le rideau, donc
  // sans que ça se voie), puis on lève le rideau. Next ne le fait pas toujours :
  // il garde la position tant que le haut de la page reste visible dans le viewport.
  // `instant` court-circuite le `scroll-behavior: smooth` du CSS.
  useEffect(() => {
    if (busy.current) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    uncover();
  }, [pathname, uncover]);

  const go = useCallback(
    (href: string) => {
      if (prefersReducedMotion()) return false;
      if (busy.current) return true;
      // `window.location.pathname` inclut `basePath` (ex. /atelier404/undercover) ; les `href`
      // qu'on écrit dans le code, non — comme pour next/link. On retire le préfixe avant de comparer.
      const currentPath = BASE_PATH && window.location.pathname.startsWith(BASE_PATH)
        ? window.location.pathname.slice(BASE_PATH.length) || '/'
        : window.location.pathname;
      if (pathOf(href) === pathOf(currentPath)) return false;

      const meta = getRouteMeta(href);
      busy.current = true;
      document.documentElement.dataset.covering = 'true';

      if (panelRef.current && labelRef.current) {
        panelRef.current.style.background = meta.background;
        panelRef.current.style.color = meta.foreground;
        labelRef.current.textContent = meta.label;
      }

      gsap
        .timeline()
        .set(overlayRef.current, { visibility: 'visible', pointerEvents: 'auto' })
        .fromTo(panelRef.current, { yPercent: 100 }, { yPercent: 0, duration: 0.65, ease: 'power4.inOut' })
        .fromTo(labelRef.current, { yPercent: 130 }, { yPercent: 0, duration: 0.55, ease: 'power3.out' }, '-=0.3')
        .call(() => router.push(href));

      // Filet de sécurité si la navigation échoue.
      failsafe.current = window.setTimeout(uncover, 5000);
      return true;
    },
    [router, uncover],
  );

  return (
    <TransitionContext.Provider value={{ go }}>
      {children}
      <div ref={overlayRef} className="wipe" aria-hidden="true">
        <div ref={panelRef} className="wipe__panel">
          <span className="wipe__mask">
            <span ref={labelRef} className="wipe__label" />
          </span>
        </div>
      </div>
    </TransitionContext.Provider>
  );
}

/** `next/link` qui déclenche le rideau de transition (clic simple uniquement). */
export function TLink({ href, onClick, ...props }: ComponentProps<typeof Link>) {
  const transition = useContext(TransitionContext);
  const target = typeof href === 'string' ? href : (href.pathname ?? '');

  return (
    <Link
      href={href}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (props.target && props.target !== '_self') return;
        if (!target.startsWith('/') || target.startsWith('/#')) return;
        if (transition?.go(target)) event.preventDefault();
      }}
    />
  );
}
