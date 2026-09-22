'use client';

import { useEffect, useRef, type ComponentPropsWithoutRef } from 'react';

/**
 * `<select>` stylable grâce à nice-select2 (chargé côté client uniquement).
 * Le `<select>` natif reste dans le DOM, masqué visuellement : c'est lui qui porte le
 * label, la valeur, la validation, le clavier et les lecteurs d'écran. La liste stylée
 * est réservée à la souris (`aria-hidden`, hors ordre de tabulation) et se synchronise
 * dessus via l'événement `change`.
 */
export function Select(props: ComponentPropsWithoutRef<'select'>) {
  const ref = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const select = ref.current;
    if (!select) return;

    let cancelled = false;
    let destroy: (() => void) | undefined;

    // nice-select2 reconstruit sa liste à chaque `change` natif : on réapplique les attributs.
    const hardenDropdown = () => {
      const dropdown = select.nextElementSibling as HTMLElement | null;
      if (!dropdown?.classList.contains('nice-select')) return;
      dropdown.setAttribute('aria-hidden', 'true');
      dropdown.tabIndex = -1;
    };

    import('nice-select2').then(({ default: NiceSelect }) => {
      if (cancelled) return;
      const instance = new NiceSelect(select, {
        searchable: false,
        placeholder: select.querySelector('option[value=""]')?.textContent ?? '',
      });
      hardenDropdown();
      select.addEventListener('change', hardenDropdown);
      destroy = () => {
        select.removeEventListener('change', hardenDropdown);
        instance.destroy();
      };
    });

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, []);

  return <select ref={ref} {...props} />;
}
