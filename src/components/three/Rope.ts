import { CatmullRomCurve3, MathUtils, Object3D, Vector3, type InstancedMesh } from 'three';

/**
 * Câble simulé par intégration de Verlet : une chaîne de points reliés par des contraintes
 * de distance, dont la tête suit la souris et la queue est fixe. Le rendu échantillonne
 * une courbe de Catmull-Rom et place des perles (InstancedMesh) le long du tracé.
 */
export class Rope {
  private readonly points: Vector3[];
  private readonly previous: Vector3[];
  private readonly curve: CatmullRomCurve3;
  private readonly dummy = new Object3D();
  private readonly head = new Vector3();

  constructor(
    private readonly count: number,
    private readonly segment: number,
    private readonly iterations: number,
    private readonly beads: number,
  ) {
    this.points = Array.from({ length: count }, () => new Vector3());
    this.previous = Array.from({ length: count }, () => new Vector3());
    this.curve = new CatmullRomCurve3(this.points);
  }

  /** Dispose le câble en arc entre la souris et la prise, puis le laisse se « poser ». */
  reset(mouse: Vector3, yaw: number, tail: Vector3) {
    this.attach(mouse, yaw);
    this.points.forEach((point, i) => {
      const t = i / (this.count - 1);
      point.set(
        MathUtils.lerp(this.head.x, tail.x, t),
        0.06,
        MathUtils.lerp(this.head.z, tail.z, t) + Math.sin(t * Math.PI * 2) * 0.9,
      );
      this.previous[i].copy(point);
    });
    for (let i = 0; i < 80; i += 1) this.step(mouse, yaw, tail, i * 0.016);
  }

  /** Avance la simulation d'un pas. */
  step(mouse: Vector3, yaw: number, tail: Vector3, time: number) {
    const { points, previous, count } = this;
    this.attach(mouse, yaw);

    for (let i = 1; i < count - 1; i += 1) {
      const p = points[i];
      const q = previous[i];
      const vx = (p.x - q.x) * 0.93;
      const vz = (p.z - q.z) * 0.93;
      q.copy(p);
      p.x += vx;
      p.z += vz;
      p.y = 0.06 + Math.sin(time * 1.5 + i) * 0.006;
    }

    for (let k = 0; k < this.iterations; k += 1) {
      points[0].copy(this.head);
      points[count - 1].copy(tail);
      for (let i = 0; i < count - 1; i += 1) {
        const a = points[i];
        const b = points[i + 1];
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const distance = Math.hypot(dx, dz) || 0.0001;
        const diff = ((distance - this.segment) / distance) * 0.5;
        if (i > 0) {
          a.x += dx * diff;
          a.z += dz * diff;
        }
        if (i + 1 < count - 1) {
          b.x -= dx * diff;
          b.z -= dz * diff;
        }
      }
    }
  }

  /** Écrit la position des perles dans l'InstancedMesh. */
  draw(mesh: InstancedMesh) {
    this.curve.getPoints(this.beads - 1).forEach((point, index) => {
      this.dummy.position.copy(point);
      this.dummy.updateMatrix();
      mesh.setMatrixAt(index, this.dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }

  /** Le câble sort par le museau de la souris. */
  private attach(mouse: Vector3, yaw: number) {
    this.head.set(-Math.sin(yaw), 0, -Math.cos(yaw)).multiplyScalar(0.95).add(mouse);
    this.head.y = 0.06;
  }
}
