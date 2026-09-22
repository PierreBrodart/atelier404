'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MathUtils, PlaneGeometry, type Group } from 'three';
import { CrtScreen } from './CrtScreen';
import { easeOutBack, roundedBox, type SceneProps } from './shared';

const DEFAULT_LINES = ['introuvable', 'ailleurs_'];

/**
 * Écran cathodique bleu : suit le curseur, se détourne au scroll,
 * réagit au survol (l'écran change de message).
 */
export function CrtMonitor({ reduced, pointer, color = '#2A47FF', lines = DEFAULT_LINES }: SceneProps) {
  const group = useRef<Group>(null);
  const hovered = useRef(false);
  const lastDraw = useRef(-1);
  const invalidate = useThree((state) => state.invalidate);
  const [screen] = useState(() => new CrtScreen());

  const geometries = useMemo(() => {
    // Écran bombé : le centre avance de quelques centièmes
    const glass = new PlaneGeometry(1.8, 1.35, 20, 16);
    const position = glass.attributes.position;
    for (let i = 0; i < position.count; i += 1) {
      const nx = position.getX(i) / 0.9;
      const ny = position.getY(i) / 0.675;
      position.setZ(i, 0.07 * (1 - (nx * nx + ny * ny) / 2));
    }
    glass.computeVertexNormals();
    return {
      glass,
      front: roundedBox(2.5, 2.15, 0.9, 0.22),
      back: roundedBox(1.65, 1.4, 1.1, 0.3),
      bezel: roundedBox(2.05, 1.62, 0.14, 0.16, 0.02),
      foot: roundedBox(1.5, 0.12, 0.9, 0.05, 0.02),
    };
  }, []);

  // Première image de l'écran (suffisante en mode « mouvement réduit »)
  useEffect(() => {
    screen.draw(1.2, lines, false);
    invalidate();
  }, [screen, lines, invalidate]);

  useEffect(
    () => () => {
      screen.dispose();
      Object.values(geometries).forEach((geometry) => geometry.dispose());
    },
    [screen, geometries],
  );

  useFrame((state, delta) => {
    const model = group.current;
    if (!model) return;

    if (reduced) {
      model.rotation.set(0, -0.32, 0);
      model.scale.setScalar(0.92);
      return;
    }

    const time = state.clock.elapsedTime;
    const scroll = Math.min(window.scrollY / window.innerHeight, 1.6);
    const intro = easeOutBack(Math.min(time / 1.1, 1));
    const target = 0.92 * intro * (hovered.current ? 1.06 : 1);

    model.scale.setScalar(MathUtils.damp(model.scale.x, target, 8, delta));
    model.rotation.y = MathUtils.damp(model.rotation.y, -0.3 + pointer.current.x * 0.55 + scroll * 0.9, 4, delta);
    model.rotation.x = MathUtils.damp(model.rotation.x, -pointer.current.y * 0.22, 4, delta);
    model.position.y = Math.sin(time * 1.3) * 0.06 - scroll * 0.4;

    // L'écran se redessine ~11 fois par seconde : largement suffisant, et économe
    if (time - lastDraw.current > 0.09) {
      lastDraw.current = time;
      screen.draw(time, lines, hovered.current);
    }
  });

  return (
    <group
      ref={group}
      position={[0, -0.05, 0]}
      onPointerOver={() => {
        hovered.current = true;
      }}
      onPointerOut={() => {
        hovered.current = false;
      }}
    >
      {/* coque */}
      <mesh geometry={geometries.front}>
        <meshStandardMaterial color={color} roughness={0.42} />
      </mesh>
      <mesh geometry={geometries.back} position={[0, 0, -0.95]}>
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>

      {/* cadre sombre + écran bombé */}
      <mesh geometry={geometries.bezel} position={[0, 0.17, 0.46]}>
        <meshStandardMaterial color="#16133B" roughness={0.35} />
      </mesh>
      <mesh geometry={geometries.glass} position={[0, 0.17, 0.53]}>
        <meshBasicMaterial map={screen.texture} toneMapped={false} />
      </mesh>

      {/* façade : voyant + boutons + fente */}
      <mesh position={[0.85, -0.78, 0.47]}>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshBasicMaterial color="#3ED8A0" toneMapped={false} />
      </mesh>
      {[-0.95, -0.65, -0.35].map((x) => (
        <mesh key={x} position={[x, -0.78, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.12, 20]} />
          <meshStandardMaterial color={x === -0.95 ? '#FF4A2E' : '#FFC61A'} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0.4, -0.78, 0.47]}>
        <boxGeometry args={[0.62, 0.05, 0.03]} />
        <meshStandardMaterial color="#16133B" />
      </mesh>

      {/* pied */}
      <mesh position={[0, -1.17, -0.05]}>
        <cylinderGeometry args={[0.5, 0.7, 0.14, 24]} />
        <meshStandardMaterial color="#FFF3DC" roughness={0.6} />
      </mesh>
      <mesh geometry={geometries.foot} position={[0, -1.3, -0.05]}>
        <meshStandardMaterial color="#FFF3DC" roughness={0.6} />
      </mesh>

      {/* antenne, parce qu'il en fallait une */}
      <mesh position={[-0.35, 1.5, -0.95]} rotation={[0, 0, 0.45]}>
        <cylinderGeometry args={[0.012, 0.012, 0.9, 6]} />
        <meshStandardMaterial color="#16133B" />
      </mesh>
      <mesh position={[0.35, 1.5, -0.95]} rotation={[0, 0, -0.45]}>
        <cylinderGeometry args={[0.012, 0.012, 0.9, 6]} />
        <meshStandardMaterial color="#16133B" />
      </mesh>
    </group>
  );
}
