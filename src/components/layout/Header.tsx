'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { navigation, siteConfig } from '@/data/site';
import { accentVar, onAccentVar } from '@/lib/accent';
import { isActivePath } from '@/lib/routes';
import { TLink } from './PageTransition';

/**
 * Barre de navigation flottante + menu plein écran sur mobile.
 * Le menu mobile : bouton `aria-expanded`, fermeture à Échap, focus piégé,
 * défilement de la page bloqué, contenu masqué (`inert`) tant qu'il est fermé.
 */
export function Header() {
  const pathname = usePathname();
  // Le menu est « ouvert pour » une page précise : il se referme donc tout seul à chaque navigation.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === pathname;
  const burgerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const burger = burgerRef.current;
    const menu = menuRef.current;
    if (!burger || !menu) return;

    document.body.style.overflow = 'hidden';
    menu.querySelector<HTMLElement>('a')?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenFor(null);
        burger.focus();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusables = [burger, ...menu.querySelectorAll<HTMLElement>('a')];
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const desktop = window.matchMedia('(min-width: 1024px)');
    const onDesktop = () => desktop.matches && setOpenFor(null);

    document.addEventListener('keydown', onKeyDown);
    desktop.addEventListener('change', onDesktop);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
      desktop.removeEventListener('change', onDesktop);
    };
  }, [open]);

  return (
    <header className="header">
      <div className="header__bar">
        <TLink href="/" className="logo" aria-label={`${siteConfig.name} — accueil`}>
          <span className="logo__word">Atelier</span>
          <span className="logo__num" aria-hidden="true">
            404
          </span>
        </TLink>

        <nav className="header__nav" aria-label="Navigation principale">
          <ul className="header__list">
            {navigation.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <TLink
                    href={item.href}
                    className="nav-link"
                    aria-current={active ? 'page' : undefined}
                    style={{ '--link-accent': accentVar(item.accent), '--link-on': onAccentVar(item.accent) } as CSSProperties}
                  >
                    <span className="roll">
                      <span className="roll__a">{item.label}</span>
                      <span className="roll__b" aria-hidden="true">
                        {item.label}
                      </span>
                    </span>
                  </TLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <button
          ref={burgerRef}
          type="button"
          className="header__burger"
          aria-expanded={open}
          aria-controls="menu-mobile"
          onClick={() => setOpenFor(open ? null : pathname)}
        >
          <span className="header__burger-label">{open ? 'Fermer' : 'Menu'}</span>
          <span className="header__burger-icon" aria-hidden="true" />
        </button>
      </div>

      <div ref={menuRef} id="menu-mobile" className="menu" data-open={open} inert={!open}>
        <nav aria-label="Menu mobile" className="menu__nav">
          <ul className="menu__list">
            {[{ label: 'Accueil', href: '/', accent: 'tomato' as const }, ...navigation].map((item, index) => (
              <li key={item.href} className="menu__item" style={{ '--i': index } as CSSProperties}>
                <TLink
                  href={item.href}
                  className="menu__link"
                  aria-current={isActivePath(pathname, item.href) ? 'page' : undefined}
                  style={{ '--link-accent': accentVar(item.accent) } as CSSProperties}
                >
                  <span className="menu__index" aria-hidden="true">
                    0{index + 1}
                  </span>
                  {item.label}
                </TLink>
              </li>
            ))}
          </ul>
          <p className="menu__note">
            Atelier 404 — {siteConfig.baseline}
          </p>
        </nav>
      </div>
    </header>
  );
}
