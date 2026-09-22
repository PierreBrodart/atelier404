'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MathUtils, Vector3, type Group, type InstancedMesh } from 'three';
import { Rope } from './Rope';
import type { SceneProps } from './shared';

const POINTS = 20;
const SEGMENT = 0.34;
const BEADS = 96;
const ITERATIONS = 8;

/**
 * Souris d'ordinateur à câble : elle suit le curseur, le câble (physique simple,
 * voir Rope.ts) traîne derrière elle. Sans curseur (tactile), elle se promène toute seule.
 */
export function MouseCable({ reduced, pointer }: SceneProps) {
  const size = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);
  const mouse = useRef<Group>(null);
  const beads = useRef<InstancedMesh>(null);
  const yaw = useRef(0.6);
  const position = useRef(new Vector3(0, 0, 0));
  const [rope] = useState(() => new Rope(POINTS, SEGMENT, ITERATIONS, BEADS));

  const aspect = size.width / Math.max(size.height, 1);
  const halfX = Math.min(3.6, 1.9 * aspect);
  const halfZ = 1.5;
  const tail = useMemo(() => new Vector3(halfX + 0.3, 0.06, halfZ + 0.4), [halfX]);

  // Pose initiale (aussi utilisée telle quelle en mode « mouvement réduit »)
  useEffect(() => {
    position.current.set(-halfX * 0.35, 0, -0.2);
    rope.reset(position.current, yaw.current, tail);
    if (mouse.current) {
      mouse.current.position.copy(position.current);
      mouse.current.rotation.y = yaw.current;
    }
    if (beads.current) rope.draw(beads.current);
    invalidate();
  }, [halfX, rope, tail, invalidate]);

  useFrame((state, delta) => {
    if (reduced) return;
    const model = mouse.current;
    if (!model) return;

    const time = state.clock.elapsedTime;
    const idle = pointer.current.x === 0 && pointer.current.y === 0;
    const targetX = idle ? Math.sin(time * 0.6) * halfX * 0.55 : pointer.current.x * halfX * 0.85;
    const targetZ = idle ? Math.cos(time * 0.8) * halfZ * 0.6 : -pointer.current.y * halfZ * 0.9;

    const previousX = position.current.x;
    const previousZ = position.current.z;
    position.current.x = MathUtils.damp(previousX, targetX, 3.2, delta);
    position.current.z = MathUtils.damp(previousZ, targetZ, 3.2, delta);

    // La souris s'oriente dans le sens du déplacement
    const vx = position.current.x - previousX;
    const vz = position.current.z - previousZ;
    if (Math.hypot(vx, vz) > 0.002) {
      const heading = Math.atan2(-vx, -vz);
      const wrapped = MathUtils.euclideanModulo(heading - yaw.current + Math.PI, Math.PI * 2) - Math.PI;
      yaw.current += wrapped * Math.min(delta * 6, 1);
    }

    model.position.copy(position.current);
    model.position.y = Math.sin(time * 6) * 0.004;
    model.rotation.y = yaw.current;
    model.rotation.z = MathUtils.damp(model.rotation.z, -(vx * 3), 6, delta);

    rope.step(position.current, yaw.current, tail, time);
    if (beads.current) rope.draw(beads.current);
  });

  return (
    <>
      <group ref={mouse}>
        <mesh position={[0, 0.2, 0]} scale={[0.66, 0.34, 1.05]}>
          <sphereGeometry args={[1, 32, 24]} />
          <meshStandardMaterial color="#FFF3DC" roughness={0.4} />
        </mesh>
        {/* boutons + molette */}
        <mesh position={[0, 0.535, -0.32]}>
          <boxGeometry args={[0.03, 0.02, 0.62]} />
          <meshStandardMaterial color="#16133B" />
        </mesh>
        <mesh position={[0, 0.55, -0.3]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.12, 16]} />
          <meshStandardMaterial color="#FF4A2E" roughness={0.4} />
        </mesh>
        <mesh position={[-0.28, 0.5, -0.55]} rotation={[-0.35, 0, 0.35]}>
          <boxGeometry args={[0.36, 0.02, 0.5]} />
          <meshStandardMaterial color="#FFC61A" />
        </mesh>
        <mesh position={[0.28, 0.5, -0.55]} rotation={[-0.35, 0, -0.35]}>
          <boxGeometry args={[0.36, 0.02, 0.5]} />
          <meshStandardMaterial color="#FFC61A" />
        </mesh>
      </group>

      <instancedMesh ref={beads} args={[undefined, undefined, BEADS]} frustumCulled={false}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshStandardMaterial color="#16133B" roughness={0.5} />
      </instancedMesh>

      {/* prise au bout du câble */}
      <mesh position={[tail.x, 0.1, tail.z]}>
        <boxGeometry args={[0.36, 0.2, 0.44]} />
        <meshStandardMaterial color="#2A47FF" roughness={0.4} />
      </mesh>
    </>
  );
}
