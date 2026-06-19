import * as THREE from 'three';
import { Dog } from './Dog';
import { FootprintSystem } from '../footprints/FootprintSystem';
import { SandParams } from '../sand/sandParams';

function nextRandomState(state: number): number {
  return (1664525 * state + 1013904223) >>> 0;
}

export class DogManager {
  private readonly dogs: Dog[];
  private readonly meshes: THREE.Mesh[];
  private readonly positions: THREE.Vector2[];
  private randomState = 0x4f1bbcdd;
  private worldHalfWidth: number;
  private worldHalfHeight: number;

  constructor(params: SandParams, footprintSystem: FootprintSystem, worldHalfWidth: number, worldHalfHeight: number) {
    const count = Math.max(1, Math.floor(params.dogCount));
    this.dogs = new Array<Dog>(count);
    this.meshes = new Array<THREE.Mesh>(count);
    this.positions = new Array<THREE.Vector2>(count);
    this.worldHalfWidth = Math.max(1, worldHalfWidth);
    this.worldHalfHeight = Math.max(1, worldHalfHeight);

    for (let i = 0; i < count; i += 1) {
      const x = this.randomRange(-this.worldHalfWidth * 0.72, this.worldHalfWidth * 0.72);
      const z = this.randomRange(-this.worldHalfHeight * 0.62, this.worldHalfHeight * 0.62);
      const dog = new Dog(
        1000 + i * 97 + Math.floor(this.random01() * 10000),
        params,
        footprintSystem,
        x,
        z,
        this.worldHalfWidth,
        this.worldHalfHeight
      );

      this.dogs[i] = dog;
      this.meshes[i] = dog.getMesh();
      this.positions[i] = dog.pos;
    }
  }

  setBounds(worldHalfWidth: number, worldHalfHeight: number): void {
    this.worldHalfWidth = Math.max(1, worldHalfWidth);
    this.worldHalfHeight = Math.max(1, worldHalfHeight);

    for (let i = 0; i < this.dogs.length; i += 1) {
      this.dogs[i].setBounds(this.worldHalfWidth, this.worldHalfHeight);
    }
  }

  update(dt: number, target: THREE.Vector2 | null): void {
    for (let i = 0; i < this.dogs.length; i += 1) {
      this.dogs[i].update(dt, target, this.dogs);
    }
  }

  getMeshes(): readonly THREE.Mesh[] {
    return this.meshes;
  }

  getPositions(): readonly THREE.Vector2[] {
    return this.positions;
  }

  dispose(): void {
    for (let i = 0; i < this.dogs.length; i += 1) {
      this.dogs[i].dispose();
    }
  }

  private random01(): number {
    this.randomState = nextRandomState(this.randomState);
    return this.randomState / 4294967296;
  }

  private randomRange(min: number, max: number): number {
    return min + (max - min) * this.random01();
  }
}
