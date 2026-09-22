import type { Theme, ThemeInfo } from '@/lib/undercover/types';
import { animals } from './animals';
import { brands } from './brands';
import { characters } from './characters';
import { celebrities } from './celebrities';
import { cities } from './cities';
import { clothing } from './clothing';
import { countries } from './countries';
import { dailyLife } from './daily-life';
import { drinks } from './drinks';
import { food } from './food';
import { jobs } from './jobs';
import { movies } from './movies';
import { music } from './music';
import { nature } from './nature';
import { objects } from './objects';
import { places } from './places';
import { series } from './series';
import { sports } from './sports';
import { technology } from './technology';
import { vehicles } from './vehicles';
import { videogames } from './videogames';

/**
 * Banque de mots d'Undercover.
 * SERVEUR UNIQUEMENT : ce module ne doit jamais être importé par un composant client
 * (les paires ne doivent pas être envoyées aux navigateurs). Le client reçoit
 * uniquement `themeInfos` (identifiant, libellé, nombre de paires).
 *
 * Pour ajouter un thème : créer `mon-theme.ts` avec `defineTheme(...)` et l'ajouter ici.
 */
export const themes: Theme[] = [
  animals,
  celebrities,
  movies,
  series,
  videogames,
  food,
  drinks,
  objects,
  jobs,
  places,
  countries,
  cities,
  sports,
  brands,
  characters,
  music,
  technology,
  nature,
  vehicles,
  clothing,
  dailyLife,
];

export const getTheme = (id: string) => themes.find((theme) => theme.id === id);

/** Liste des thèmes sans les mots, envoyée au client. */
export const themeInfos: ThemeInfo[] = themes.map(({ id, label, icon, pairs }) => ({
  id,
  label,
  icon,
  pairCount: pairs.length,
}));
