import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Enregistrement unique du plugin (ce module n'est importé que côté client).
gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };
