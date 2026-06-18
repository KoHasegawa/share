import * as THREE from 'three';
import { SandParams } from '../sand/sandParams';
import { FootprintType } from './footprintTypes';

export const MAX_FOOTPRINTS = 15;

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
  readonly count: number;
  readonly posYawAge: Float32Array;
  readonly scaleDepthSideSeed: Float32Array;
}

export class FootprintSystem {
  public readonly buffer: Footprint[] = new Array<Footprint>(MAX_FOOTPRINTS);

  private readonly params: SandParams;
  private readonly type: FootprintType;

  private readonly compositePosYawAge = new Float32Array(MAX_FOOTPRINTS * 4);
  private readonly compositeScaleDepthSideSeed = new Float32Array(MAX_FOOTPRINTS * 4);
  private compositeCount = 0;

  private readonly quantizedAge = new Uint8Array(MAX_FOOTPRINTS);
  private readonly quantizedDepth = new Uint8Array(MAX_FOOTPRINTS);

  private writeIndex = 0;
  private nextSide: -1 | 1 = -1;

  private stride: number;
  private lateralOffset: number;

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
    }
  }

  get revision(): number {
    return this._revision;
  }

  setFootprintWorldSize(worldSize: number): void {
    const size = Math.max(0.1, worldSize);
    this.stride = size * 0.62;
    this.lateralOffset = size * 0.17;
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

    this._revision += 1;
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
      fp.depthScale = depthBase * decay;

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

      this.compositeScaleDepthSideSeed[outBase] = fp.scale;
      this.compositeScaleDepthSideSeed[outBase + 1] = fp.depthScale;
      this.compositeScaleDepthSideSeed[outBase + 2] = fp.side;
      this.compositeScaleDepthSideSeed[outBase + 3] = fp.seed;

      activeCount += 1;
    }

    for (let i = activeCount; i < MAX_FOOTPRINTS; i += 1) {
      const base = i * 4;
      this.compositePosYawAge[base] = 0;
      this.compositePosYawAge[base + 1] = 0;
      this.compositePosYawAge[base + 2] = 0;
      this.compositePosYawAge[base + 3] = 1;

      this.compositeScaleDepthSideSeed[base] = 0;
      this.compositeScaleDepthSideSeed[base + 1] = 0;
      this.compositeScaleDepthSideSeed[base + 2] = 0;
      this.compositeScaleDepthSideSeed[base + 3] = 0;
    }

    if (this.compositeCount !== activeCount) {
      this.compositeCount = activeCount;
      changed = true;
    }

    if (changed) {
      this._revision += 1;
    }
  }

  getCompositeData(): FootprintCompositeData {
    return {
      count: this.compositeCount,
      posYawAge: this.compositePosYawAge,
      scaleDepthSideSeed: this.compositeScaleDepthSideSeed
    };
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

    fp.yaw = Math.atan2(dir.y, dir.x) + angleJitter;
    fp.scale = scaleJitter;
    fp.side = side;
    fp.seed = this.random01() * 1000.0;
    fp.bornTime = performance.now() * 0.001;
    fp.age = 0;
    fp.ageNormalized = 0;
    fp.depthScale = 1.0;

    this.quantizedAge[this.writeIndex] = 0;
    this.quantizedDepth[this.writeIndex] = 255;

    this.writeIndex = (this.writeIndex + 1) % MAX_FOOTPRINTS;
    this._revision += 1;
  }

  private random01(): number {
    this.randomState = (1664525 * this.randomState + 1013904223) >>> 0;
    return this.randomState / 4294967296;
  }
}
