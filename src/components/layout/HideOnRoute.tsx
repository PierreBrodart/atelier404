'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Ne rend pas `children` sur `prefix` et ses sous-pages (ex. `/undercover`, `/undercover/ABCD`).
 * Sert à retirer un élément du layout racine (le footer) sur une section du site.
 */
export function HideOnRoute({ prefix, children }: { prefix: string; children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return null;
  return children;
}
