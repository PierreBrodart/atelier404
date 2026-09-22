import type { ProcessStep, Service } from './types';

export const services: Service[] = [
  {
    slug: 'sites-web',
    number: '01',
    name: 'Sites web',
    tagline: 'Des vitrines qui ont du caractère.',
    description:
      "Un site qui ressemble à votre projet, pas à un thème acheté 59 €. On conçoit des sites rapides, accessibles et bien écrits, avec juste ce qu'il faut de surprise pour qu'on s'en souvienne.",
    deliverables: ['Design sur mesure', 'Intégration responsive', 'Accessibilité RGAA', 'Rédaction & structure SEO'],
    stack: ['Next.js', 'TypeScript', 'SCSS'],
    accent: 'tomato',
  },
  {
    slug: 'experiences-interactives',
    number: '02',
    name: 'Expériences interactives',
    tagline: 'Du WebGL, du scroll et des gadgets utiles.',
    description:
      "Objets 3D, récits au scroll, mini-jeux, configurateurs : on transforme une visite en petite aventure. Toujours avec un plan B léger pour ceux qui préfèrent le calme.",
    deliverables: ['Direction interactive', 'Scènes 3D temps réel', 'Animations GSAP', 'Version « mouvement réduit »'],
    stack: ['Three.js', 'React Three Fiber', 'GSAP'],
    accent: 'blue',
  },
  {
    slug: 'e-commerce',
    number: '03',
    name: 'E-commerce',
    tagline: 'Des boutiques qui donnent envie de payer.',
    description:
      "Catalogue clair, parcours d'achat sans fausse note, fiches produit qui racontent quelque chose. On branche votre solution (Shopify, Medusa, Stripe…) et on soigne chaque pixel du panier.",
    deliverables: ['Parcours d’achat', 'Fiches produit éditoriales', 'Intégration paiement', 'Suivi des conversions'],
    stack: ['Shopify', 'Medusa', 'Stripe'],
    accent: 'sun',
  },
  {
    slug: 'design-direction-artistique',
    number: '04',
    name: 'Design & direction artistique',
    tagline: 'Une identité qu’on reconnaît de loin.',
    description:
      "Logo, typographies, couleurs, ton de voix, système de composants : on pose les bases visuelles de votre présence en ligne — et on les documente pour que tout le monde s'y retrouve.",
    deliverables: ['Identité visuelle', 'Design system', 'Maquettes Figma', 'Motion design'],
    stack: ['Figma', 'Lottie', 'Storybook'],
    accent: 'pink',
  },
  {
    slug: 'developpement-sur-mesure',
    number: '05',
    name: 'Développement sur mesure',
    tagline: 'Quand le prêt-à-porter ne va pas.',
    description:
      "Outil interne, back-office, intégration d'API, application web : on code ce qui n'existe pas encore, proprement, avec des tests et une documentation qu'un humain peut lire.",
    deliverables: ['Applications web', 'API & intégrations', 'Tests automatisés', 'Documentation technique'],
    stack: ['Node.js', 'PostgreSQL', 'React'],
    accent: 'mint',
  },
  {
    slug: 'maintenance-evolution',
    number: '06',
    name: 'Maintenance & évolution',
    tagline: 'On reste après la fête. Et on fait la vaisselle.',
    description:
      "Mises à jour, sauvegardes, surveillance, petites améliorations : votre site continue de bien vieillir. Un forfait clair, un humain qui répond, et zéro mauvaise surprise le vendredi soir.",
    deliverables: ['Mises à jour & sécurité', 'Surveillance 24/7', 'Évolutions mensuelles', 'Support réactif'],
    stack: ['CI/CD', 'Monitoring', 'Vercel'],
    accent: 'ink',
  },
];

export const processSteps: ProcessStep[] = [
  {
    number: '01',
    title: 'On papote',
    text: "Un café, vos envies, vos contraintes. On repart avec un cadrage clair et une question ou deux que vous ne vous étiez pas posées.",
  },
  {
    number: '02',
    title: 'On gribouille',
    text: "Croquis, moodboards, maquettes. On teste des directions franches avant de choisir celle qui vous ressemble le plus.",
  },
  {
    number: '03',
    title: 'On code',
    text: "Développement en itérations courtes, avec une version en ligne à montrer dès les premières semaines.",
  },
  {
    number: '04',
    title: 'On chouchoute',
    text: "Accessibilité, performance, tests sur vrais appareils. C'est le moment où l'on pinaille — pour que vous n'ayez pas à le faire.",
  },
  {
    number: '05',
    title: 'On lance (et on reste)',
    text: "Mise en ligne, formation, suivi. Et si vous avez besoin de nous ensuite, on répond au téléphone.",
  },
];
