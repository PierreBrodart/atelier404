import type { TeamMember } from './types';

/**
 * Équipe PROVISOIRE : noms, rôles et descriptions à remplacer.
 * Quand un profil est définitif, passer `placeholder` à `false`
 * (le repère « profil provisoire » disparaît).
 */
export const team: TeamMember[] = [
  {
    id: 'camille',
    name: 'Jules Crevoisier',
    role: 'Direction artistique & design',
    bio: "Je travaille par passion, mais à condition d'avoir au moins 50 ias",
    funFact: { label: 'Outil préféré', value: 'Un feutre qui bave' },
    photo: {
      src: '/images/equipe/jules.jpg',
      alt: 'Portrait souriant de Camille, directrice artistique (photo provisoire)',
      width: 900,
      height: 1350,
    },
    accent: 'pink',
    placeholder: true,
  },
  {
    id: 'yanis',
    name: 'Jordan Septier',
    role: 'Développeur créatif (WebGL)',
    bio: " Hmm je scouby travaille.",
    funFact: { label: 'Bug préféré', value: 'Celui qui disparaît quand on le montre' },
    photo: {
      src: '/images/equipe/jordan.jpg',
      alt: 'Portrait souriant de Yanis, développeur créatif (photo provisoire)',
      width: 900,
      height: 1350,
    },
    accent: 'sun',
    placeholder: true,
  },
  {
    id: 'nina',
    name: 'Pierre Mon Bro-dart',
    role: 'Cheffe de projet & développement',
    bio: "Je sais pas ce que je fais là mdr",
    funFact: { label: 'Superpouvoir', value: 'Dire non avec le sourire' },
    photo: {
      src: '/images/equipe/pierre.jpg',
      alt: 'Nina travaillant sur son ordinateur portable (photo provisoire)',
      width: 900,
      height: 601,
    },
    accent: 'mint',
    placeholder: true,
  },
];

export const values = [
  {
    title: 'Fait main',
    text: "Pas de template déguisé. Chaque site part d'une page blanche et d'une vraie conversation.",
  },
  {
    title: 'Accessible d’abord',
    text: "Un site créatif que tout le monde ne peut pas utiliser est un site raté. On ne négocie pas là-dessus.",
  },
  {
    title: 'Léger comme une plume',
    text: "Le beau n'est pas lourd. On mesure, on optimise, on supprime ce qui ne sert pas.",
  },
  {
    title: 'Un peu absurde',
    text: "On prend le travail au sérieux, pas nous-mêmes. Ça se voit, et ça se ressent en ligne.",
  },
];
