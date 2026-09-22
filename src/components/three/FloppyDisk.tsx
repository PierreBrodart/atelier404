'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { CanvasTexture, Color, MathUtils, SRGBColorSpace, type Group, type MeshStandardMaterial } from 'three';
import { roundedBox, type SceneProps } from './shared';

/** Étiquette collée sur la disquette (dessinée une fois). */
function drawLabel(lines: string[]) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 340;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#FFF3DC';
    ctx.fillRect(0, 0, 512, 340);
    ctx.fillStyle = '#FF4A2E';
    ctx.fillRect(0, 0, 512, 46);
    ctx.strokeStyle = 'rgba(22,19,59,0.25)';
    ctx.lineWidth = 2;
    for (let y = 120; y < 340; y += 52) {
      ctx.beginPath();
      ctx.moveTo(24, y);
      ctx.lineTo(488, y);
      ctx.stroke();
    }
    ctx.fillStyle = '#16133B';
    ctx.textAlign = 'left';
    ctx.font = 'bold 30px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillText('ATELIER404 · 1,44 Mo', 24, 34);
    ctx.font = 'bold 72px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillText(lines[0] ?? 'SERVICES', 24, 112);
    ctx.font = 'italic 40px Georgia, serif';
    ctx.fillText(lines[1] ?? 'fait main, pas copié-collé', 24, 200);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * Disquette dont la couleur suit le service survolé. Tourne avec le scroll,
 * s'incline vers le curseur.
 */
export function FloppyDisk({ reduced, pointer, color = '#FF4A2E', lines }: SceneProps) {
  const group = useRef<Group>(null);
  const body = useRef<MeshStandardMaterial>(null);
  const target = useMemo(() => new Color(color), [color]);
  const label = useMemo(() => drawLabel(lines ?? []), [lines]);
  const geometries = useMemo(() => ({ body: roundedBox(2.1, 2.1, 0.1, 0.1, 0.02) }), []);

  useEffect(
    () => () => {
      label.dispose();
      geometries.body.dispose();
    },
    [label, geometries],
  );

  useFrame((state, delta) => {
    const model = group.current;
    if (!model) return;

    if (reduced) {
      body.current?.color.copy(target);
      model.rotation.set(-0.15, -0.5, 0.05);
      return;
    }

    const time = state.clock.elapsedTime;
    const progress = window.scrollY / Math.max(window.innerHeight, 1);
    body.current?.color.lerp(target, 1 - Math.exp(-delta * 8));
    model.rotation.y = MathUtils.damp(model.rotation.y, -0.4 + progress * 1.4 + pointer.current.x * 0.5, 4, delta);
    model.rotation.x = MathUtils.damp(model.rotation.x, -0.1 - pointer.current.y * 0.3, 4, delta);
    model.rotation.z = Math.sin(time * 0.8) * 0.06;
    model.position.y = Math.sin(time * 1.1) * 0.09;
  });

  return (
    <group ref={group} scale={0.98}>
      <mesh geometry={geometries.body}>
        <meshStandardMaterial ref={body} color={color} roughness={0.45} />
      </mesh>

      {/* volet métallique */}
      <mesh position={[0.1, 0.72, 0.06]}>
        <boxGeometry args={[1.1, 0.7, 0.04]} />
        <meshStandardMaterial color="#D5D9E6" metalness={0.35} roughness={0.35} />
      </mesh>
      <mesh position={[0.35, 0.72, 0.085]}>
        <boxGeometry args={[0.26, 0.44, 0.03]} />
        <meshStandardMaterial color="#16133B" />
      </mesh>

      {/* étiquette avant + moyeu arrière */}
      <mesh position={[0, -0.42, 0.052]}>
        <planeGeometry args={[1.6, 1.06]} />
        <meshStandardMaterial map={label} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.1, -0.055]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[0.55, 32]} />
        <meshStandardMaterial color="#D5D9E6" metalness={0.35} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.1, -0.06]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[0.17, 24]} />
        <meshStandardMaterial color="#16133B" />
      </mesh>
    </group>
  );
}
