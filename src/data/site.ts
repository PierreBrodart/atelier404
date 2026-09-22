import type { ContactInfo, NavItem } from './types';

export const siteConfig = {
  name: 'Atelier 404',
  baseline: 'Des sites introuvables ailleurs.',
  description:
    'Atelier 404, agence web créative à Troyes : sites, expériences interactives, e-commerce et direction artistique. Fabriqués à la main, introuvables ailleurs.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://mmi24e02.mmi-troyes.fr',
  locale: 'fr_FR',
  foundedYear: 2019,
  city: 'Troyes',
} as const;

export const navigation: NavItem[] = [
  { label: 'Projets', href: '/projets', accent: 'blue' },
  { label: 'Services', href: '/services', accent: 'sun' },
  { label: 'Équipe', href: '/equipe', accent: 'pink' },
  { label: 'Contact', href: '/contact', accent: 'mint' },
];

/** Coordonnées fictives : à remplacer avant mise en ligne. */
export const contact: ContactInfo = {
  email: 'bonjour@atelier404.fr',
  phone: '02 40 04 04 04',
  phoneHref: '+33240040404',
  address: {
    street: "12 rue de l'Introuvable",
    zip: '44000',
    city: 'Troyes',
    country: 'France',
  },
  hours: 'Du lundi au vendredi, 9h30 – 18h (le café est prêt dès 9h)',
  socials: [
    { label: 'Instagram', href: 'https://instagram.com/atelier404', handle: '@atelier404' },
    { label: 'LinkedIn', href: 'https://linkedin.com/company/atelier404', handle: 'Atelier 404' },
    { label: 'GitHub', href: 'https://github.com/atelier404', handle: 'atelier404' },
  ],
};

/** Sujets proposés dans le formulaire de contact. */
export const contactTopics = [
  'Un nouveau site web',
  'Une expérience interactive',
  'Une boutique en ligne',
  'Une identité / direction artistique',
  'Un développement sur mesure',
  'Reprendre / faire évoluer un site existant',
  'Autre chose (surprenez-nous)',
];
