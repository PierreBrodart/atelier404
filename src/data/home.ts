import type { ImageAsset } from './types';

/** Textes de la page d'accueil (hors services / projets / équipe). */
export const homeContent = {
  hero: {
    eyebrow: 'Agence web créative · Troyes',
    /** Les mots entourés de *étoiles* sont mis en valeur. */
    title: 'Des sites *introuvables* ailleurs.',
    intro:
      "On dessine, on code et on bidouille des sites web et des expériences interactives faits main. Ce que vous cherchez n'existe pas encore ? C'est notre spécialité.",
    primaryCta: { label: 'Voir les projets', href: '/projets' },
    secondaryCta: { label: "Écrire à l'atelier", href: '/contact' },
  },
  marquee: [
    'Sites web',
    'Expériences interactives',
    'E-commerce',
    'Direction artistique',
    'Développement sur mesure',
    'Maintenance',
  ],
  manifesto: {
    label: 'Le manifeste',
    text: "Atelier 404, c'est une petite agence de fabricants de sites. On refuse poliment le copier-coller et on adore les idées que personne n'a encore essayées. Alors oui, parfois ça ne se trouve pas dans le catalogue : on le construit.",
    facts: [
      { value: '404', label: 'erreurs assumées (pour la déco)' },
      { value: '0', label: 'template copié-collé' },
      { value: '100 %', label: 'fait main à Troyes' },
    ],
  },
  services: {
    label: 'Ce qu’on fabrique',
    title: 'Six façons de ne pas faire comme tout le monde.',
    hint: 'Survolez ou parcourez les lignes',
  },
  projects: {
    label: 'Des projets pas comme les autres',
    title: 'Fraîchement sortis de l’atelier.',
  },
  team: {
    label: 'Les gens derrière les pixels',
    title: 'Une équipe de trois têtes, six mains, beaucoup de café.',
    text: "Design, développement, gestion de projet : on travaille ensemble dans le même atelier, autour de la même table (et de la même machine à café).",
  },
  cta: {
    title: 'Un projet ? Une idée absurde ? Un bug ?',
    text: 'Racontez-nous. On répond en moins de 48 h, même le lundi.',
    label: 'Parlons-en',
  },
} as const;

export const servicesPageContent = {
  title: 'Ce qu’on sait faire (et ce qu’on adore faire).',
  intro:
    "Six métiers, une seule équipe. On peut tout prendre en charge du croquis à la maintenance, ou intervenir sur une seule étape. Dans tous les cas, vous parlez à ceux qui fabriquent.",
  process: { label: 'Comment ça se passe', title: 'Cinq étapes. Zéro mauvaise surprise.' },
  cta: 'Vous ne voyez pas votre besoin ici ? Bonne nouvelle : c’est probablement pour ça que vous nous cherchiez.',
};

export const teamPageContent = {
  title: 'Les têtes derrière l’atelier.',
  intro:
    "Une équipe resserrée, des métiers complémentaires et une règle : personne ne dit « c'est pas mon rayon ». Voici ceux qui répondront à vos e-mails (et à qui vous pourrez faire des blagues).",
  valuesTitle: 'Ce en quoi on croit',
  join: {
    title: 'On recrute parfois.',
    text: "Pas d'offre ouverte pour l'instant, mais si vous aimez le code propre, les interfaces qui bougent et la bonne humeur, écrivez-nous : on garde les candidatures spontanées au chaud.",
  },
  photo: {
    src: '/images/atelier/equipe.jpg',
    alt: 'Une équipe réunie autour d’une table, ordinateurs ouverts (photo provisoire)',
    width: 1600,
    height: 1067,
  } satisfies ImageAsset,
};

export const projectsPageContent = {
  title: 'Nos projets, sortis de l’atelier.',
  intro:
    "Cinq histoires, cinq univers. Chaque projet est né d'une conversation, d'un moodboard et d'une petite obsession. Cliquez : on vous raconte les coulisses.",
};

export const contactPageContent = {
  title: 'Dites bonjour.',
  intro:
    "Un projet, une question, une idée trop bizarre pour être envoyée à quelqu'un d'autre ? Écrivez-nous. On lit tout, on répond vite et on ne vous rappellera pas dix fois pour vendre autre chose.",
  formTitle: 'Le formulaire (aussi simple qu’un ticket de caisse)',
};

export const servicesImages: ImageAsset[] = [
  { src: '/images/atelier/code.jpg', alt: 'Lignes de code colorées sur un écran sombre', width: 1400, height: 935 },
  { src: '/images/atelier/circuit.jpg', alt: 'Gros plan sur un circuit imprimé', width: 1400, height: 933 },
  { src: '/images/atelier/poste.jpg', alt: 'Poste de travail avec ordinateur portable affichant du code', width: 1400, height: 932 },
];
