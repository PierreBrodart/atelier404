import type { ImageAsset, Project } from './types';

const img = (src: string, width: number, height: number, alt: string): ImageAsset => ({
  src: `/images/projets/${src}`,
  width,
  height,
  alt,
});

/**
 * Projets fictifs. Pour en ajouter un : copier un objet ci-dessous,
 * changer le `slug` — la page /projets/<slug> est générée automatiquement.
 * Les photos viennent d'Unsplash (licence libre).
 */
export const projects: Project[] = [
  {
    slug: 'retro-pixel',
    name: 'Rétro-Pixel',
    year: 2025,
    category: 'Expérience interactive',
    client: 'Musée du jeu vidéo de Rennes',
    tagline: 'Un musée qu’on visite avec les doigts.',
    summary:
      "Un site-borne d'arcade pour un musée du jeu vidéo : on y visite les collections comme on parcourt un niveau.",
    role: ['Direction artistique', 'Développement', 'Expérience 3D'],
    technologies: ['Next.js', 'React Three Fiber', 'GSAP', 'Sanity'],
    theme: { background: '#FF8AD1', foreground: '#16133B' },
    cover: img('retro-pixel-1.jpg', 1800, 1200, 'Consoles et ordinateurs rétro éclairés de néons roses et bleus'),
    gallery: [
      img('retro-pixel-2.jpg', 1400, 933, 'Pluie de caractères verts façon écran de terminal'),
      img('retro-pixel-3.jpg', 1400, 991, 'Ordinateur portable ouvert dans le noir, éclairé par son écran'),
    ],
    story: {
      brief:
        "Le musée voulait donner envie de pousser la porte, y compris à ceux qui n'ont jamais tenu une manette. Le site devait être aussi ludique que les salles, sans jamais sacrifier la consultation des horaires et des tarifs.",
      approach:
        "On a transformé la navigation en « sélection de niveau » : chaque collection est une cartouche 3D que l'on fait tourner avant de la lancer. Les transitions imitent le chargement d'une console, mais durent moins d'une seconde. Tout est jouable au clavier, et les animations se désactivent proprement en mode « mouvement réduit ».",
      result:
        "Les visites virtuelles durent trois fois plus longtemps et le nombre de billets réservés en ligne a bondi dès le premier mois. Le musée a fini par imprimer la cartouche 3D sur ses tote bags.",
    },
    highlights: [
      { value: '×3', label: 'durée moyenne de visite' },
      { value: '+62 %', label: 'billets réservés en ligne' },
      { value: '98', label: 'score Lighthouse accessibilité' },
    ],
    featured: true,
  },
  {
    slug: 'jaune-vif',
    name: 'Jaune Vif',
    year: 2025,
    category: 'E-commerce',
    client: 'Jaune Vif — streetwear éthique',
    tagline: 'Une boutique qui se voit de l’autre côté de la rue.',
    summary:
      "Une boutique en ligne de streetwear éthique, pensée comme un lookbook qu'on peut acheter.",
    role: ['Identité web', 'Design e-commerce', 'Intégration Shopify'],
    technologies: ['Shopify', 'Next.js', 'Stripe', 'GSAP'],
    theme: { background: '#FFC61A', foreground: '#16133B' },
    cover: img('jaune-vif-1.jpg', 1800, 2492, 'Silhouette en survêtement jaune vif devant un ciel bleu'),
    gallery: [
      img('jaune-vif-2.jpg', 1400, 933, 'Smartphone affichant une grille d’applications colorées'),
      img('jaune-vif-3.jpg', 1400, 1017, 'Montre connectée blanche posée sur un fond clair'),
    ],
    story: {
      brief:
        "Une petite marque avec de gros vêtements — et une boutique en ligne qui ressemblait à toutes les autres. L'objectif : vendre autant l'attitude que les pièces, sans alourdir le parcours d'achat.",
      approach:
        "Chaque collection prend la couleur de son drop, la page produit se lit comme une page de magazine, et le panier reste sobre pour aller vite. Les images sont servies en AVIF, les fiches produit se chargent en statique, et le paiement ne demande jamais plus de trois écrans.",
      result:
        "Un panier moyen en hausse, un taux d'abandon divisé par deux et une marque enfin reconnaissable sur les réseaux : le jaune est devenu sa signature.",
    },
    highlights: [
      { value: '+38 %', label: 'panier moyen' },
      { value: '÷2', label: "taux d'abandon panier" },
      { value: '0,9 s', label: 'affichage de la page produit' },
    ],
    featured: true,
  },
  {
    slug: 'cap-sauvage',
    name: 'Cap Sauvage',
    year: 2024,
    category: 'Site événementiel',
    client: 'Festival Cap Sauvage',
    tagline: 'Un festival de plein air, avec la route en fil rouge.',
    summary:
      "Le site d'un festival itinérant : un long ruban de route qui déroule programme, lieux et billetterie.",
    role: ['Direction artistique', 'Développement', 'Motion design'],
    technologies: ['Next.js', 'GSAP ScrollTrigger', 'SCSS', 'Mapbox'],
    theme: { background: '#FF4A2E', foreground: '#16133B' },
    cover: img('cap-sauvage-1.jpg', 1800, 2700, 'Route sinueuse traversant un canyon rouge au coucher du soleil'),
    gallery: [
      img('cap-sauvage-2.jpg', 1400, 834, 'Vallée verdoyante sous un ciel nuageux'),
      img('cap-sauvage-3.jpg', 1400, 932, 'Sentier dans une forêt de grands arbres'),
    ],
    story: {
      brief:
        "Un festival qui change de décor chaque année et dont l'identité tenait dans un fichier PDF. Il fallait un site qui donne envie de partir, et qui reste lisible en plein soleil, sur un téléphone, avec 12 % de batterie.",
      approach:
        "Le site se parcourt comme un road trip : on scrolle, la route avance, les étapes du programme apparaissent aux carrefours. Contrastes élevés, typographie généreuse, animations optionnelles : tout ce qui est essentiel est dans le HTML, même sans JavaScript.",
      result:
        "La billetterie a affiché complet quatre semaines plus tôt que l'édition précédente, et 70 % des visites venaient d'un mobile — sans un seul retour d'utilisateur perdu.",
    },
    highlights: [
      { value: '−4 sem.', label: 'avant complet' },
      { value: '70 %', label: 'de visites mobiles' },
      { value: '12 000', label: 'festivaliers' },
    ],
    featured: true,
  },
  {
    slug: 'ouvert-tard',
    name: 'Ouvert Tard',
    year: 2024,
    category: 'Site & e-commerce',
    client: 'Ouvert Tard — concept-store de quartier',
    tagline: 'La lumière reste allumée. En ligne aussi.',
    summary:
      "Le concept-store de quartier qui vend en ligne comme il accueille en boutique : chaleureusement.",
    role: ['Site vitrine', 'Click & collect', 'Photographie web'],
    technologies: ['Next.js', 'Medusa', 'Stripe', 'SCSS'],
    theme: { background: '#2A47FF', foreground: '#FFF3DC' },
    cover: img('ouvert-tard-1.jpg', 1800, 1200, 'Enseigne « OPEN SHOP » accrochée à une vitrine'),
    gallery: [
      img('ouvert-tard-2.jpg', 1400, 934, 'Intérieur d’une boutique avec étagères et suspensions'),
      img('ouvert-tard-3.jpg', 1400, 934, 'Vendeur et cliente au comptoir d’une boutique lumineuse'),
    ],
    story: {
      brief:
        "Une boutique de quartier aimée de tous, mais qui perdait des clients dès que la porte fermait. Le site devait prolonger l'ambiance du lieu et proposer le retrait en boutique sans prise de tête.",
      approach:
        "L'enseigne « OPEN » est devenue le fil conducteur : elle s'allume selon les vrais horaires, et le catalogue se met à jour en temps réel. Le click & collect tient en deux étapes, et les gérants modifient tout depuis une interface qu'ils ont prise en main en dix minutes.",
      result:
        "Un tiers du chiffre d'affaires passe désormais par le site, et le retrait en boutique a fait revenir des clients qui ne passaient plus la porte.",
    },
    highlights: [
      { value: '33 %', label: "du CA réalisé en ligne" },
      { value: '2', label: 'étapes pour commander' },
      { value: '10 min', label: 'de prise en main' },
    ],
    featured: false,
  },
  {
    slug: 'encre-vive',
    name: 'Encre Vive',
    year: 2023,
    category: 'Direction artistique',
    client: 'Encre Vive — festival de musiques électroniques',
    tagline: 'Un festival qui coule sur l’écran.',
    summary:
      "Direction artistique et site d'un festival électro : de l'encre, du mouvement, et zéro cliché de club.",
    role: ['Identité visuelle', 'Site web', 'Génératif'],
    technologies: ['Next.js', 'WebGL', 'GSAP', 'SCSS'],
    theme: { background: '#3ED8A0', foreground: '#16133B' },
    cover: img('encre-vive-1.jpg', 1800, 1200, 'Nuage d’encre bleu, rouge et turquoise dans l’eau'),
    gallery: [
      img('encre-vive-2.jpg', 1400, 933, 'Composition abstraite de couleurs vives et de bulles'),
      img('encre-vive-3.jpg', 1400, 933, 'Confettis brillants sur fond turquoise'),
    ],
    story: {
      brief:
        "Une première édition, peu de budget, et l'envie de ne ressembler à aucun autre festival électro. Il fallait une identité forte, réutilisable sur les affiches, les écrans et le web.",
      approach:
        "L'encre dans l'eau est devenue le langage visuel : formes organiques, couleurs saturées, mouvement lent. Le site réagit au curseur comme un liquide, avec une version statique complète pour les visiteurs sensibles aux animations.",
      result:
        "L'identité a été adoptée par le festival et ses partenaires ; la première édition a fait salle comble et la seconde a doublé sa jauge.",
    },
    highlights: [
      { value: '×2', label: 'jauge en 2e édition' },
      { value: '5', label: 'supports déclinés' },
      { value: '100 %', label: 'sans dépendance externe' },
    ],
    featured: true,
  },
];

export const getProject = (slug: string) => projects.find((project) => project.slug === slug);

export const getFeaturedProjects = () => projects.filter((project) => project.featured);

/** Projet suivant dans la liste (boucle sur le premier). */
export const getNextProject = (slug: string) => {
  const index = projects.findIndex((project) => project.slug === slug);
  return projects[(index + 1) % projects.length];
};
