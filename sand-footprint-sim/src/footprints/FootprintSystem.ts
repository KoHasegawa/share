import * as THREE from 'three';
import { SandParams } from '../sand/sandParams';
import { FootprintType } from './footprintTypes';

export const MAX_FOOTPRINTS = 15;

// How long a fresh print takes to fully "press" into the sand.
const APPEAR_DURATION = 0.18;

// Ease-out-back: rises past 1.0 then settles, giving the print a small
// stamping "pop" as it pushes into the sand.
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const p = t - 1;
  return 1 + c3 * p * p * p + c1 * p * p;
}

export interface Footprint {
  active: boolean;
  pos: THREE.Vector2;
  yaw: number;
  scale: number;
  side: -1 | 1;
  seed: number;
  bornTime: number;
  age: number;
  ageNormalized: number;
  depthScale: number;
}

export interface FootprintCompositeData {
  count: number;
  posYawAge: Float32Array;
  scaleDepthAspectSeed: Float32Array;
}

export class FootprintSystem {
  public readonly buffer: Footprint[] = new Array<Footprint>(MAX_FOOTPRINTS);

  private readonly params: SandParams;
  private readonly type: FootprintType;

  private readonly compositePosYawAge = new Float32Array(MAX_FOOTPRINTS * 4);
  private readonly compositeScaleDepthAspectSeed = new Float32Array(MAX_FOOTPRINTS * 4);
  private readonly compositeData: FootprintCompositeData = {
    count: 0,
    posYawAge: this.compositePosYawAge,
    scaleDepthAspectSeed: this.compositeScaleDepthAspectSeed
  };
  private compositeCount = 0;

  private readonly quantizedAge = new Uint8Array(MAX_FOOTPRINTS);
  private readonly quantizedDepth = new Uint8Array(MAX_FOOTPRINTS);

  private writeIndex = 0;
  private nextSide: -1 | 1 = -1;

  private stride: number;
  private lateralOffset: number;
  private baseScale: number;

  private trailInitialized = false;
  private readonly trailLastPos = new THREE.Vector2();
  private trailDistanceSinceSpawn = 0;

  private readonly spawnPos = new THREE.Vector2();
  private readonly spawnDir = new THREE.Vector2();
  private readonly perp = new THREE.Vector2();

  private randomState = 0x6d2b79f5;
  private stampTexture: THREE.Texture | null = null;
  private stampEdgeCollapseQuantized = -1;

  private _revision = 1;

  constructor(type: FootprintType, params: SandParams, footprintWorldSize: number) {
    this.type = type;
    this.params = params;

    const size = Math.max(0.1, footprintWorldSize);
    this.stride = size * 0.62;
    this.lateralOffset = size * 0.17;
    this.baseScale = size * 0.5;

    for (let i = 0; i < MAX_FOOTPRINTS; i += 1) {
      this.buffer[i] = {
        active: false,
        pos: new THREE.Vector2(),
        yaw: 0,
        scale: 1,
        side: -1,
        seed: 0,
        bornTime: 0,
        age: 0,
        ageNormalized: 1,
        depthScale: 0
      };
      this.quantizedAge[i] = 255;
      this.quantizedDepth[i] = 0;
    }
  }

  get revision(): number {
    return this._revision;
  }

  setFootprintWorldSize(worldSize: number): void {
    const size = Math.max(0.1, worldSize);
    this.stride = size * 0.62;
    this.lateralOffset = size * 0.17;
    this.baseScale = size * 0.5;
  }

  // Forget the previous drag so a new gesture does not spawn prints along the
  // line connecting the old end point to the new start point.
  resetTrail(): void {
    this.trailInitialized = false;
    this.trailDistanceSinceSpawn = 0;
  }

  clear(): void {
    for (let i = 0; i < MAX_FOOTPRINTS; i += 1) {
      this.buffer[i].active = false;
      this.buffer[i].age = 0;
      this.buffer[i].ageNormalized = 1;
      this.buffer[i].depthScale = 0;
      this.quantizedAge[i] = 255;
      this.quantizedDepth[i] = 0;
    }

    this.writeIndex = 0;
    this.nextSide = -1;
    this.trailInitialized = false;
    this.trailDistanceSinceSpawn = 0;
    this.compositeCount = 0;
    this.compositeData.count = 0;
    this.zeroCompositeRange(0);

    this._revision += 1;
  }

  clearPassedByWashFront(front: number): boolean {
    let changed = false;
    for (let i = 0; i < MAX_FOOTPRINTS; i += 1) {
      const fp = this.buffer[i];
      if (!fp.active) {
        continue;
      }
      if (fp.pos.y >= front) {
        fp.active = false;
        fp.age = 0;
        fp.ageNormalized = 1;
        fp.depthScale = 0;
        this.quantizedAge[i] = 255;
        this.quantizedDepth[i] = 0;
        changed = true;
      }
    }

    if (!changed) {
      return false;
    }

    this.rebuildCompositeSnapshot();
    this._revision += 1;
    return true;
  }

  addAlongTrail(pos: THREE.Vector2, dir: THREE.Vector2): void {
    const dirLenSq = dir.lengthSq();
    if (dirLenSq <= 1e-8) {
      return;
    }

    if (!this.trailInitialized) {
      this.trailInitialized = true;
      this.trailLastPos.copy(pos);
      this.trailDistanceSinceSpawn = this.stride;
    }

    this.spawnDir.copy(dir).normalize();
    const segmentLen = this.spawnPos.subVectors(pos, this.trailLastPos).length();

    if (segmentLen <= 1e-8) {
      return;
    }

    let consumed = 0;
    while (consumed < segmentLen) {
      const remainingToSpawn = this.stride - this.trailDistanceSinceSpawn;
      const step = Math.min(remainingToSpawn, segmentLen - consumed);
      consumed += step;
      this.trailDistanceSinceSpawn += step;

      if (this.trailDistanceSinceSpawn >= this.stride - 1e-6) {
        const t = consumed / segmentLen;
        this.spawnPos.lerpVectors(this.trailLastPos, pos, t);
        this.spawnFootprint(this.spawnPos, this.spawnDir);
        this.trailDistanceSinceSpawn = 0;
      }
    }

    this.trailLastPos.copy(pos);
  }

  update(nowSeconds: number): void {
    let changed = false;
    let activeCount = 0;

    const decaySpeed = Math.max(0.02, this.params.decaySpeed);
    const depthBase =
      (0.35 + this.params.bodyWeight * 0.85) *
      (0.2 + this.params.footprintDepth * 0.9) *
      (1.0 - this.params.hardness * 0.55);

    for (let i = 0; i < MAX_FOOTPRINTS; i += 1) {
      const fp = this.buffer[i];
      if (!fp.active) {
        continue;
      }

      fp.age = Math.max(0, nowSeconds - fp.bornTime);
      fp.ageNormalized = THREE.MathUtils.clamp(fp.age * decaySpeed * 0.23, 0, 1);

      const decay = Math.exp(-fp.age * decaySpeed * 0.9);
      const appear = easeOutBack(THREE.MathUtils.clamp(fp.age / APPEAR_DURATION, 0, 1));
      fp.depthScale = depthBase * decay * appear;

      const qAge = Math.round(fp.ageNormalized * 255);
      const qDepth = Math.round(THREE.MathUtils.clamp(fp.depthScale, 0, 1) * 255);

      if (qAge !== this.quantizedAge[i] || qDepth !== this.quantizedDepth[i]) {
        this.quantizedAge[i] = qAge;
        this.quantizedDepth[i] = qDepth;
        changed = true;
      }

      if (fp.ageNormalized >= 1 && fp.depthScale < 0.02) {
        fp.active = false;
        changed = true;
        continue;
      }

      const outBase = activeCount * 4;
      this.compositePosYawAge[outBase] = fp.pos.x;
      this.compositePosYawAge[outBase + 1] = fp.pos.y;
      this.compositePosYawAge[outBase + 2] = fp.yaw;
      this.compositePosYawAge[outBase + 3] = fp.ageNormalized;

      this.compositeScaleDepthAspectSeed[outBase] = fp.scale;
      this.compositeScaleDepthAspectSeed[outBase + 1] = fp.depthScale;
      this.compositeScaleDepthAspectSeed[outBase + 2] = fp.side * this.type.aspect;
      this.compositeScaleDepthAspectSeed[outBase + 3] = fp.seed;

      activeCount += 1;
    }

    this.zeroCompositeRange(activeCount);

    if (this.compositeCount !== activeCount) {
      this.compositeCount = activeCount;
      changed = true;
    }
    this.compositeData.count = this.compositeCount;

    if (changed) {
      this._revision += 1;
    }
  }

  getCompositeData(): FootprintCompositeData {
    return this.compositeData;
  }

  getStampTexture(edgeCollapse: number): THREE.Texture {
    const qEdge = Math.round(THREE.MathUtils.clamp(edgeCollapse, 0, 1) * 64);
    if (this.stampTexture && qEdge === this.stampEdgeCollapseQuantized) {
      return this.stampTexture;
    }

    if (this.stampTexture) {
      this.stampTexture.dispose();
      this.stampTexture = null;
    }

    this.stampEdgeCollapseQuantized = qEdge;
    this.stampTexture = this.type.generateStampTexture({
      size: 256,
      edgeCollapse: qEdge / 64,
      seed: 1337.0,
      claw: 0.35 + this.params.hardness * 0.5
    });

    return this.stampTexture;
  }

  dispose(): void {
    if (this.stampTexture) {
      this.stampTexture.dispose();
      this.stampTexture = null;
    }
  }

  private spawnFootprint(pos: THREE.Vector2, dir: THREE.Vector2): void {
    const fp = this.buffer[this.writeIndex];

    this.perp.set(-dir.y, dir.x);
    const side = this.nextSide;
    this.nextSide = side === -1 ? 1 : -1;

    const angleJitter = (this.random01() * 2 - 1) * 0.12;
    const scaleJitter = 1.0 + (this.random01() * 2 - 1) * 0.06;

    const alongJitter = (this.random01() * 2 - 1) * this.stride * 0.08;
    const acrossJitter = (this.random01() * 2 - 1) * this.lateralOffset * 0.28;

    fp.active = true;
    fp.pos
      .copy(pos)
      .addScaledVector(dir, alongJitter)
      .addScaledVector(this.perp, side * this.lateralOffset + acrossJitter);

    // Toes point along the direction of travel (was reversed: +PI/2 pointed
    // the paw backwards relative to the drag).
    fp.yaw = Math.atan2(dir.y, dir.x) - Math.PI * 0.5 + angleJitter;
    fp.scale = this.baseScale * scaleJitter;
    fp.side = side;
    fp.seed = this.random01() * 1000.0;
    fp.bornTime = performance.now() * 0.001;
    fp.age = 0;
    fp.ageNormalized = 0;
    fp.depthScale = 0.0;

    this.quantizedAge[this.writeIndex] = 0;
    this.quantizedDepth[this.writeIndex] = 0;

    this.writeIndex = (this.writeIndex + 1) % MAX_FOOTPRINTS;
    this._revision += 1;
  }

  private zeroCompositeRange(fromIndex: number): void {
    for (let i = fromIndex; i < MAX_FOOTPRINTS; i += 1) {
      const base = i * 4;
      this.compositePosYawAge[base] = 0;
      this.compositePosYawAge[base + 1] = 0;
      this.compositePosYawAge[base + 2] = 0;
      this.compositePosYawAge[base + 3] = 1;

      this.compositeScaleDepthAspectSeed[base] = 0;
      this.compositeScaleDepthAspectSeed[base + 1] = 0;
      this.compositeScaleDepthAspectSeed[base + 2] = this.type.aspect;
      this.compositeScaleDepthAspectSeed[base + 3] = 0;
    }
  }

  private rebuildCompositeSnapshot(): void {
    let activeCount = 0;
    for (let i = 0; i < MAX_FOOTPRINTS; i += 1) {
      const fp = this.buffer[i];
      if (!fp.active) {
        continue;
      }

      const outBase = activeCount * 4;
      this.compositePosYawAge[outBase] = fp.pos.x;
      this.compositePosYawAge[outBase + 1] = fp.pos.y;
      this.compositePosYawAge[outBase + 2] = fp.yaw;
      this.compositePosYawAge[outBase + 3] = fp.ageNormalized;

      this.compositeScaleDepthAspectSeed[outBase] = fp.scale;
      this.compositeScaleDepthAspectSeed[outBase + 1] = fp.depthScale;
      this.compositeScaleDepthAspectSeed[outBase + 2] = fp.side * this.type.aspect;
      this.compositeScaleDepthAspectSeed[outBase + 3] = fp.seed;

      activeCount += 1;
    }

    this.zeroCompositeRange(activeCount);
    this.compositeCount = activeCount;
    this.compositeData.count = activeCount;
  }

  private random01(): number {
    this.randomState = (1664525 * this.randomState + 1013904223) >>> 0;
    return this.randomState / 4294967296;
  }
}
