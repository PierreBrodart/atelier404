import { getProject } from '@/data/projects';
import { navigation } from '@/data/site';
import type { AccentName } from '@/data/types';
import { accentVar, onAccentVar } from './accent';

export interface RouteMeta {
  label: string;
  accent: AccentName;
  background: string;
  foreground: string;
}

const cleanPath = (href: string) => href.split(/[?#]/)[0].replace(/\/$/, '') || '/';

/** Le lien `href` correspond-il à la page courante (ou à l'une de ses sous-pages) ? */
export const isActivePath = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

/** Libellé + couleurs d'une destination (utilisé par le rideau de transition). */
export function getRouteMeta(href: string): RouteMeta {
  const path = cleanPath(href);

  if (path.startsWith('/projets/')) {
    const project = getProject(path.split('/')[2]);
    if (project) {
      return {
        label: project.name,
        accent: 'blue',
        background: project.theme.background,
        foreground: project.theme.foreground,
      };
    }
  }

  if (path === '/undercover' || path.startsWith('/undercover/')) {
    return { label: 'Undercover', accent: 'pink', background: accentVar('pink'), foreground: onAccentVar('pink') };
  }

  const item = navigation.find((entry) => isActivePath(path, entry.href));
  const accent: AccentName = item?.accent ?? 'tomato';
  return {
    label: item?.label ?? 'Accueil',
    accent,
    background: accentVar(accent),
    foreground: onAccentVar(accent),
  };
}
