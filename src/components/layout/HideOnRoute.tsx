'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Ne rend pas `children` sur `prefix` (ou l'un de `prefixes`) et ses sous-pages
 * (ex. `/undercover`, `/undercover/ABCD`). Sert à retirer un élément du layout racine
 * (le footer) sur une section du site.
 */
export function HideOnRoute({ prefix, prefixes, children }: { prefix?: string; prefixes?: string[]; children: ReactNode }) {
  const pathname = usePathname();
  const list = prefixes ?? (prefix ? [prefix] : []);
  const hidden = list.some((item) => pathname === item || pathname.startsWith(`${item}/`));
  return hidden ? null : children;
}
