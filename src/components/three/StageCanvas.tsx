'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { Component, useEffect, type ReactNode } from 'react';
import { usePointer } from '@/lib/usePointer';
import { usePrefersReducedMotion } from '@/lib/useReducedMotion';
import { CrtMonitor } from './CrtMonitor';
import { FloppyDisk } from './FloppyDisk';
import { MouseCable } from './MouseCable';
import type { SceneName } from './shared';

interface StageCanvasProps {
  scene: SceneName;
  /** false quand la scène est hors écran : la boucle de rendu est suspendue */
  active: boolean;
  color?: string;
  lines?: string[];
}

const CAMERAS: Record<SceneName, { position: [number, number, number]; fov: number }> = {
  crt: { position: [0, 0.15, 7.6], fov: 32 },
  floppy: { position: [0, 0, 6.4], fov: 32 },
  mouse: { position: [0, 5.2, 6.4], fov: 35 },
};

/** Si WebGL n'est pas disponible, on n'affiche simplement rien : la 3D est décorative. */
class StageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function LookAtOrigin() {
  const camera = useThree((state) => state.camera);
  useEffect(() => {
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
}

export default function StageCanvas({ scene, active, color, lines }: StageCanvasProps) {
  const reduced = usePrefersReducedMotion();
  const pointer = usePointer();
  const camera = CAMERAS[scene];
  const props = { reduced, pointer, color, lines };

  return (
    <StageBoundary>
      <Canvas
        dpr={[1, 1.5]}
        camera={camera}
        frameloop={reduced ? 'demand' : active ? 'always' : 'never'}
        gl={{ alpha: true, antialias: true }}
      >
        <LookAtOrigin />
        <hemisphereLight args={['#ffffff', '#FFE0A8', 1.5]} />
        <directionalLight position={[3, 5, 5]} intensity={2.4} />
        <directionalLight position={[-4, 1, 3]} intensity={0.8} color="#FF8AD1" />
        {scene === 'crt' && <CrtMonitor {...props} />}
        {scene === 'floppy' && <FloppyDisk {...props} />}
        {scene === 'mouse' && <MouseCable {...props} />}
      </Canvas>
    </StageBoundary>
  );
}
