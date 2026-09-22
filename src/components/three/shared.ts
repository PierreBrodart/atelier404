import { ExtrudeGeometry, Shape, type BufferGeometry } from 'three';

export interface PointerRef {
  current: { x: number; y: number };
}

/** Props communes à toutes les scènes. */
export interface SceneProps {
  /** Préférence « mouvement réduit » : pose statique, aucun suivi du curseur */
  reduced: boolean;
  /** Position normalisée du curseur (-1 → 1) */
  pointer: PointerRef;
  /** Couleur principale de l'objet (hex) */
  color?: string;
  /** Lignes de texte affichées sur l'écran / l'étiquette */
  lines?: string[];
}

export type SceneName = 'crt' | 'floppy' | 'mouse';

/** Boîte aux angles arrondis (extrusion d'un rectangle arrondi + biseau). */
export function roundedBox(width: number, height: number, depth: number, radius: number, bevel = 0.03): BufferGeometry {
  const x = -width / 2;
  const y = -height / 2;
  const shape = new Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.absarc(x + width - radius, y + radius, radius, -Math.PI / 2, 0, false);
  shape.lineTo(x + width, y + height - radius);
  shape.absarc(x + width - radius, y + height - radius, radius, 0, Math.PI / 2, false);
  shape.lineTo(x + radius, y + height);
  shape.absarc(x + radius, y + height - radius, radius, Math.PI / 2, Math.PI, false);
  shape.lineTo(x, y + radius);
  shape.absarc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5, false);

  const straight = depth - bevel * 2;
  const geometry = new ExtrudeGeometry(shape, {
    depth: straight,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 10,
  });
  geometry.translate(0, 0, -straight / 2);
  return geometry;
}

export const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
