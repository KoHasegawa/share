import * as THREE from 'three';
import { SandParams } from '../sand/sandParams';

export class TargetManager {
  private readonly params: SandParams;
  private readonly target = new THREE.Vector2();
  private readonly mesh: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;

  private active = false;
  private age = 0;

  constructor(params: SandParams) {
    this.params = params;

    const geometry = new THREE.CircleGeometry(Math.max(0.02, params.targetWorldSize * 0.5), 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff3b30,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI * 0.5;
    this.mesh.position.set(0, 0.035, 0);
    this.mesh.visible = false;
    this.mesh.renderOrder = 9;
  }

  setTarget(worldPos: THREE.Vector2): void {
    this.target.copy(worldPos);
    this.active = true;
    this.age = 0;

    this.mesh.position.set(this.target.x, 0.035, this.target.y);
    this.mesh.visible = true;
  }

  getTarget(): THREE.Vector2 | null {
    return this.active ? this.target : null;
  }

  update(dt: number, dogPositions: readonly THREE.Vector2[]): void {
    if (!this.active) {
      return;
    }

    this.age += Math.max(0, dt);
    if (this.age >= this.params.targetLifetime) {
      this.clear();
      return;
    }

    const arriveRadiusSq = this.params.dogArriveRadius * this.params.dogArriveRadius;
    for (let i = 0; i < dogPositions.length; i += 1) {
      if (dogPositions[i].distanceToSquared(this.target) <= arriveRadiusSq) {
        this.clear();
        return;
      }
    }
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  clear(): void {
    this.active = false;
    this.age = 0;
    this.mesh.visible = false;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
