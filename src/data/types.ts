/** Couleurs d'accent du site. Chaque page / service en choisit une. */
export type AccentName = 'tomato' | 'sun' | 'blue' | 'mint' | 'pink' | 'ink';

export interface ImageAsset {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface NavItem {
  label: string;
  href: string;
  accent: AccentName;
}

export interface Service {
  slug: string;
  number: string;
  name: string;
  tagline: string;
  description: string;
  deliverables: string[];
  stack: string[];
  accent: AccentName;
}

export interface ProjectTheme {
  /** Couleur de fond de la page / carte du projet */
  background: string;
  /** Couleur du texte posée sur `background` (contraste AA vérifié) */
  foreground: string;
}

export interface Project {
  slug: string;
  name: string;
  year: number;
  category: string;
  client: string;
  tagline: string;
  /** Résumé court (cartes, listes) */
  summary: string;
  /** Rôle d'Atelier 404 sur le projet */
  role: string[];
  technologies: string[];
  theme: ProjectTheme;
  cover: ImageAsset;
  gallery: ImageAsset[];
  /** Contenu détaillé de la page projet */
  story: {
    brief: string;
    approach: string;
    result: string;
  };
  /** Chiffres marquants (fictifs) */
  highlights: { value: string; label: string }[];
  featured: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  /** Détail décalé affiché sous la bio */
  funFact: { label: string; value: string };
  photo: ImageAsset;
  accent: AccentName;
  /** true = contenu provisoire, affiche un repère « à remplacer » */
  placeholder: boolean;
}

export interface ProcessStep {
  number: string;
  title: string;
  text: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  phoneHref: string;
  address: { street: string; zip: string; city: string; country: string };
  hours: string;
  socials: { label: string; href: string; handle: string }[];
}
