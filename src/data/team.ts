import type { TeamMember } from './types';

/**
 * Équipe PROVISOIRE : noms, rôles et descriptions à remplacer.
 * Quand un profil est définitif, passer `placeholder` à `false`
 * (le repère « profil provisoire » disparaît).
 */
export const team: TeamMember[] = [
  {
    id: 'camille',
    name: 'Camille Provisoire',
    role: 'Direction artistique & design',
    bio: "Description définitive à venir. En attendant : Camille dessine des interfaces qui ont de l'allure, choisit les couleurs et défend les marges avec passion.",
    funFact: { label: 'Outil préféré', value: 'Un feutre qui bave' },
    photo: {
      src: '/images/equipe/camille.jpg',
      alt: 'Portrait souriant de Camille, directrice artistique (photo provisoire)',
      width: 900,
      height: 1350,
    },
    accent: 'pink',
    placeholder: true,
  },
  {
    id: 'yanis',
    name: 'Yanis Provisoire',
    role: 'Développeur créatif (WebGL)',
    bio: "Description définitive à venir. En attendant : Yanis fait tourner des objets 3D dans le navigateur et jure que « ça ne coûte presque rien en performance ».",
    funFact: { label: 'Bug préféré', value: 'Celui qui disparaît quand on le montre' },
    photo: {
      src: '/images/equipe/yanis.jpg',
      alt: 'Portrait souriant de Yanis, développeur créatif (photo provisoire)',
      width: 900,
      height: 1350,
    },
    accent: 'sun',
    placeholder: true,
  },
  {
    id: 'nina',
    name: 'Nina Provisoire',
    role: 'Cheffe de projet & développement',
    bio: "Description définitive à venir. En attendant : Nina orchestre les plannings, traduit « faites-moi un truc dingue » en spécifications et garde tout le monde de bonne humeur.",
    funFact: { label: 'Superpouvoir', value: 'Dire non avec le sourire' },
    photo: {
      src: '/images/equipe/nina.jpg',
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
