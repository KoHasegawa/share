import * as THREE from 'three';
import { SandParams } from '../sand/sandParams';
import { FootprintType } from './footprintTypes';
import { PawStampAtlas } from './pawStamp';

export const MAX_FOOTPRINTS = 100;

// Ease-out-back: rises past 1.0 then settles, giving the print a small
// stamping "pop" as it pushes into the sand.
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const p = t - 1;
  return 1 + c3 * p * p * p + c1 * p * p;
}

export interface AddFootprintOptions {
  foreScale: number;
  weight: number;
  aspect: number;
  side: -1 | 1;
  seed: number;
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
  weight: number;
  aspect: number;
  decayBias: number;
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
  private baseScale: number;
  private stampAtlas: PawStampAtlas | null = null;

  private _revision = 1;

  constructor(type: FootprintType, params: SandParams, footprintWorldSize: number) {
    this.type = type;
    this.params = params;

    const size = Math.max(0.1, footprintWorldSize);
    this.baseScale = size * 0.25;

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
        depthScale: 0,
        weight: 1,
        aspect: this.type.aspect,
        decayBias: 1
      };
      this.quantizedAge[i] = 255;
      this.quantizedDepth[i] = 0;
    }

    this.zeroCompositeRange(0);
  }

  get revision(): number {
    return this._revision;
  }

  setFootprintWorldSize(worldSize: number): void {
    const size = Math.max(0.1, worldSize);
    this.baseScale = size * 0.25;
  }

  clear(): void {
    for (let i = 0; i < MAX_FOOTPRINTS; i += 1) {
      this.buffer[i].active = false;
      this.buffer[i].age = 0;
      this.buffer[i].ageNormalized = 1;
      this.buffer[i].depthScale = 0;
      this.buffer[i].weight = 1;
      this.buffer[i].aspect = this.type.aspect;
      this.buffer[i].decayBias = 1;
      this.quantizedAge[i] = 255;
      this.quantizedDepth[i] = 0;
    }

    this.writeIndex = 0;
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

  addFootprint(x: number, z: number, yaw: number, opts: AddFootprintOptions): void {
    const fp = this.buffer[this.writeIndex];

    const t = THREE.MathUtils.clamp(
      (x - this.params.xLeft) / Math.max(1e-6, this.params.xRight - this.params.xLeft),
      0,
      1
    );
    const form = THREE.MathUtils.lerp(this.params.formabilityLo, this.params.formabilityHi, t);
    const decayBias = THREE.MathUtils.lerp(this.params.persistenceDecayHi, this.params.persistenceDecayLo, t);

    fp.active = true;
    fp.pos.set(x, z);
    fp.yaw = yaw;
    fp.scale = this.baseScale * Math.max(0.05, opts.foreScale) * form;
    fp.weight = Math.max(0, opts.weight) * form;
    fp.aspect = this.type.aspect * Math.max(0.05, opts.aspect);
    fp.side = opts.side;
    fp.seed = opts.seed;
    fp.bornTime = performance.now() * 0.001;
    fp.age = 0;
    fp.ageNormalized = 0;
    fp.depthScale = 0;
    fp.decayBias = decayBias;

    this.quantizedAge[this.writeIndex] = 0;
    this.quantizedDepth[this.writeIndex] = 0;

    this.writeIndex = (this.writeIndex + 1) % MAX_FOOTPRINTS;
    this._revision += 1;
  }

  update(nowSeconds: number): void {
    let changed = false;
    let activeCount = 0;

    const decaySpeed = Math.max(0.02, this.params.decaySpeed);
    const depthBase =
      (0.35 + this.params.bodyWeight * 0.85) *
      (0.2 + this.params.footprintDepth * 0.9) *
      (1.0 - this.params.hardness * 0.55);
    const appearDuration = Math.max(0.01, this.params.footprintAppearDuration);

    for (let i = 0; i < MAX_FOOTPRINTS; i += 1) {
      const fp = this.buffer[i];
      if (!fp.active) {
        continue;
      }

      fp.age = Math.max(0, nowSeconds - fp.bornTime);
      fp.ageNormalized = THREE.MathUtils.clamp(fp.age * decaySpeed * 0.23 * fp.decayBias, 0, 1);

      const decay = Math.exp(-fp.age * decaySpeed * 0.9 * fp.decayBias);
      const appear = easeOutBack(THREE.MathUtils.clamp(fp.age / appearDuration, 0, 1));
      fp.depthScale = depthBase * decay * appear * fp.weight;

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
      this.compositeScaleDepthAspectSeed[outBase + 2] = fp.side * fp.aspect;
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

  // Built once: a fixed atlas of paw variants. Dynamic edge crumbling is
  // applied per-print in the compose shader, so the atlas does not need to be
  // regenerated when sand parameters change (no rebuild stutter on mobile).
  getStampAtlas(): PawStampAtlas {
    if (!this.stampAtlas) {
      this.stampAtlas = this.type.generateStampAtlas({
        size: 256,
        edgeCollapse: 0.32,
        seed: 1337.0,
        claw: 0.4
      });
    }

    return this.stampAtlas;
  }

  dispose(): void {
    if (this.stampAtlas) {
      this.stampAtlas.texture.dispose();
      this.stampAtlas = null;
    }
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
      this.compositeScaleDepthAspectSeed[outBase + 2] = fp.side * fp.aspect;
      this.compositeScaleDepthAspectSeed[outBase + 3] = fp.seed;

      activeCount += 1;
    }

    this.zeroCompositeRange(activeCount);
    this.compositeCount = activeCount;
    this.compositeData.count = activeCount;
  }
}
