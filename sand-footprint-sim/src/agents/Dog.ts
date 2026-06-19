import * as THREE from 'three';
import { FootprintSystem, AddFootprintOptions } from '../footprints/FootprintSystem';
import { SandParams } from '../sand/sandParams';
import { generateDogTopTexture } from '../textures/generateDogTopTexture';

export type DogState = 'idle' | 'wander' | 'seek' | 'arrive';

interface GaitStep {
  side: -1 | 1;
  fore: boolean;
}

const GAIT: ReadonlyArray<GaitStep> = [
  { side: -1, fore: true }, // Front-Left
  { side: 1, fore: false }, // Hind-Right
  { side: 1, fore: true }, // Front-Right
  { side: -1, fore: false } // Hind-Left
];

function lcgNext(state: number): number {
  return (1664525 * state + 1013904223) >>> 0;
}

export class Dog {
  public readonly pos = new THREE.Vector2();
  public readonly vel = new THREE.Vector2();
  public yaw = 0;
  public state: DogState = 'idle';

  private readonly params: SandParams;
  private readonly footprintSystem: FootprintSystem;
  private readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;

  private gaitPhase = 0;
  private distSinceStep = 0;
  private randomState: number;
  private wanderYaw = 0;
  private worldHalfWidth = 1;
  private worldHalfHeight = 1;

  private readonly desired = new THREE.Vector2();
  private readonly toTarget = new THREE.Vector2();
  private readonly sepAccum = new THREE.Vector2();
  private readonly sepDelta = new THREE.Vector2();
  private readonly steering = new THREE.Vector2();
  private readonly footprintOpts: AddFootprintOptions = {
    foreScale: 1,
    weight: 1,
    aspect: 1,
    side: -1,
    seed: 0
  };

  constructor(
    seed: number,
    params: SandParams,
    footprintSystem: FootprintSystem,
    initialX: number,
    initialZ: number,
    worldHalfWidth: number,
    worldHalfHeight: number
  ) {
    this.params = params;
    this.footprintSystem = footprintSystem;
    this.randomState = (Math.floor(seed) ^ 0x9e3779b9) >>> 0;
    this.pos.set(initialX, initialZ);
    this.worldHalfWidth = worldHalfWidth;
    this.worldHalfHeight = worldHalfHeight;

    this.yaw = this.random01() * Math.PI * 2;
    this.wanderYaw = this.yaw;
    const initialSpeed = this.params.dogMaxSpeed * this.params.dogWanderSpeedFactor * (0.4 + this.random01() * 0.45);
    this.vel.set(Math.sin(this.yaw) * initialSpeed, Math.cos(this.yaw) * initialSpeed);

    const bodyColor = this.pickBodyColor();
    const bellyColor = this.pickBellyColor();
    const texture = generateDogTopTexture({
      size: this.params.dogTextureSize,
      seed,
      bodyColor,
      bellyColor
    });

    const geometry = new THREE.PlaneGeometry(this.params.dogWorldSize, this.params.dogWorldSize);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(this.pos.x, 0.02, this.pos.y);
    this.mesh.rotation.x = -Math.PI * 0.5;
    this.mesh.rotation.y = Math.PI + this.yaw;
    this.mesh.renderOrder = 10;
  }

  setBounds(worldHalfWidth: number, worldHalfHeight: number): void {
    this.worldHalfWidth = Math.max(1, worldHalfWidth);
    this.worldHalfHeight = Math.max(1, worldHalfHeight);
  }

  update(dt: number, target: THREE.Vector2 | null, neighbors: readonly Dog[]): void {
    const clampedDt = Math.min(Math.max(dt, 0), 0.05);
    if (clampedDt <= 0) {
      return;
    }

    this.desired.set(0, 0);

    if (target) {
      this.toTarget.subVectors(target, this.pos);
      const dist = this.toTarget.length();

      if (dist <= this.params.dogArriveRadius) {
        this.state = 'arrive';
        if (dist > 1e-5) {
          const arriveSpeed = this.params.dogMaxSpeed * Math.max(0, dist / this.params.dogArriveRadius) * 0.35;
          this.desired.copy(this.toTarget).multiplyScalar(arriveSpeed / dist);
        }
      } else {
        this.state = 'seek';
        this.desired.copy(this.toTarget).multiplyScalar(this.params.dogMaxSpeed / dist);
      }
    } else {
      this.state = 'wander';
      this.wanderYaw += this.gauss() * this.params.dogWanderTurnRate * clampedDt;
      this.desired.set(Math.sin(this.wanderYaw), Math.cos(this.wanderYaw));
      this.desired.multiplyScalar(this.params.dogMaxSpeed * this.params.dogWanderSpeedFactor);
    }

    this.accumulateSeparation(neighbors);
    this.desired.addScaledVector(
      this.sepAccum,
      this.params.dogMaxSpeed * this.params.dogSeparationStrength
    );

    this.applyBoundsSteering();

    this.steering.subVectors(this.desired, this.vel);
    const steeringLen = this.steering.length();
    const maxSteering = this.params.dogAcceleration;
    if (steeringLen > maxSteering && steeringLen > 1e-5) {
      this.steering.multiplyScalar(maxSteering / steeringLen);
    }

    this.vel.addScaledVector(this.steering, clampedDt);

    const speed = this.vel.length();
    if (speed > this.params.dogMaxSpeed && speed > 1e-5) {
      this.vel.multiplyScalar(this.params.dogMaxSpeed / speed);
    }

    const finalSpeed = this.vel.length();
    if (finalSpeed < 0.015 && this.state === 'arrive') {
      this.vel.set(0, 0);
    }

    this.pos.addScaledVector(this.vel, clampedDt);
    this.clampToBounds();

    const moveSpeed = this.vel.length();
    if (moveSpeed > 0.04) {
      this.yaw = Math.atan2(this.vel.x, this.vel.y);
      this.wanderYaw = this.yaw;
      this.distSinceStep += moveSpeed * clampedDt;

      if (this.distSinceStep >= this.params.dogStride) {
        this.distSinceStep -= this.params.dogStride;
        this.emitFootprint();
      }
    } else if (target === null) {
      this.distSinceStep = Math.min(this.distSinceStep, this.params.dogStride * 0.5);
    }

    this.mesh.position.set(this.pos.x, 0.02, this.pos.y);
    this.mesh.rotation.y = Math.PI + this.yaw;
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    const map = this.mesh.material.map;
    if (map) {
      map.dispose();
    }
    this.mesh.material.dispose();
  }

  private accumulateSeparation(neighbors: readonly Dog[]): void {
    this.sepAccum.set(0, 0);
    const radius = Math.max(0.01, this.params.dogSepRadius);
    const radiusSq = radius * radius;

    for (let i = 0; i < neighbors.length; i += 1) {
      const other = neighbors[i];
      if (other === this) {
        continue;
      }

      this.sepDelta.subVectors(this.pos, other.pos);
      const dSq = this.sepDelta.lengthSq();
      if (dSq <= 1e-8 || dSq >= radiusSq) {
        continue;
      }

      const d = Math.sqrt(dSq);
      const strength = (radius - d) / (radius * d);
      this.sepAccum.addScaledVector(this.sepDelta, strength);
    }
  }

  private applyBoundsSteering(): void {
    const pad = Math.max(0.05, this.params.dogBoundsPadding);
    const minX = -this.worldHalfWidth + pad;
    const maxX = this.worldHalfWidth - pad;
    const minZ = -this.worldHalfHeight + pad;
    const maxZ = this.worldHalfHeight - pad;

    if (this.pos.x < minX) {
      this.desired.x += (minX - this.pos.x) * this.params.dogAcceleration;
    } else if (this.pos.x > maxX) {
      this.desired.x -= (this.pos.x - maxX) * this.params.dogAcceleration;
    }

    if (this.pos.y < minZ) {
      this.desired.y += (minZ - this.pos.y) * this.params.dogAcceleration;
    } else if (this.pos.y > maxZ) {
      this.desired.y -= (this.pos.y - maxZ) * this.params.dogAcceleration;
    }
  }

  private clampToBounds(): void {
    const pad = Math.max(0.05, this.params.dogBoundsPadding * 0.45);
    const minX = -this.worldHalfWidth + pad;
    const maxX = this.worldHalfWidth - pad;
    const minZ = -this.worldHalfHeight + pad;
    const maxZ = this.worldHalfHeight - pad;

    if (this.pos.x < minX) {
      this.pos.x = minX;
      this.vel.x = Math.max(0, this.vel.x);
      this.wanderYaw = Math.atan2(this.vel.x, this.vel.y);
    } else if (this.pos.x > maxX) {
      this.pos.x = maxX;
      this.vel.x = Math.min(0, this.vel.x);
      this.wanderYaw = Math.atan2(this.vel.x, this.vel.y);
    }

    if (this.pos.y < minZ) {
      this.pos.y = minZ;
      this.vel.y = Math.max(0, this.vel.y);
      this.wanderYaw = Math.atan2(this.vel.x, this.vel.y);
    } else if (this.pos.y > maxZ) {
      this.pos.y = maxZ;
      this.vel.y = Math.min(0, this.vel.y);
      this.wanderYaw = Math.atan2(this.vel.x, this.vel.y);
    }
  }

  private emitFootprint(): void {
    const g = GAIT[this.gaitPhase];
    this.gaitPhase = (this.gaitPhase + 1) % GAIT.length;

    const forwardX = Math.sin(this.yaw);
    const forwardZ = Math.cos(this.yaw);
    const rightX = forwardZ;
    const rightZ = -forwardX;

    const longOffset = g.fore ? this.params.dogFootForeOffset : this.params.dogFootHindOffset;
    const acrossOffset = g.side * this.params.dogFootTrackHalf;
    const scaleJitter = 1 + this.gauss() * this.params.dogFootScaleJitter;
    const angleJitter = this.gauss() * this.params.dogFootAngleJitter;
    const toeOut = (g.fore ? this.params.dogFootToeOutFront : this.params.dogFootToeOutHind) * g.side;

    const x = this.pos.x + rightX * acrossOffset + forwardX * longOffset;
    const z = this.pos.y + rightZ * acrossOffset + forwardZ * longOffset;
    const footprintYaw = Math.atan2(forwardZ, forwardX) - Math.PI * 0.5 + toeOut + angleJitter;

    this.footprintOpts.foreScale =
      (g.fore ? this.params.dogFootFrontScale : this.params.dogFootHindScale) * Math.max(0.55, scaleJitter);
    this.footprintOpts.weight = g.fore ? this.params.dogFootFrontWeight : this.params.dogFootHindWeight;
    this.footprintOpts.aspect = g.fore ? this.params.dogFootFrontAspect : this.params.dogFootHindAspect;
    this.footprintOpts.side = g.side;
    this.footprintOpts.seed = this.random01() * 1000.0;

    this.footprintSystem.addFootprint(x, z, footprintYaw, this.footprintOpts);
  }

  private pickBodyColor(): string {
    const r = this.random01();
    if (r < 0.18) {
      return '#2e2723';
    }
    if (r < 0.36) {
      return '#7d4c2d';
    }
    if (r < 0.55) {
      return '#a46a3e';
    }
    if (r < 0.74) {
      return '#c99c64';
    }
    if (r < 0.9) {
      return '#e4d3b7';
    }
    return '#89847b';
  }

  private pickBellyColor(): string {
    const r = this.random01();
    if (r < 0.45) {
      return '#f0e2cc';
    }
    if (r < 0.78) {
      return '#d8c3a1';
    }
    return '#f7f1e5';
  }

  private random01(): number {
    this.randomState = lcgNext(this.randomState);
    return this.randomState / 4294967296;
  }

  private gauss(): number {
    return this.random01() + this.random01() + this.random01() - 1.5;
  }
}
