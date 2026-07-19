import * as THREE from 'three';

export interface PawStampOptions {
  size: number;
  edgeCollapse: number;
  seed: number;
  claw: number;
}

type StampCanvas = HTMLCanvasElement | OffscreenCanvas;
type StampContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

interface EllipsePad {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotation: number;
  amplitude: number;
  exponent: number;
  seedOffset: number;
  roughness: number;
  crumble: number;
}

interface ToeSpec {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  amplitude: number;
}

const TWO_PI = Math.PI * 2;

function fract(v: number): number {
  return v - Math.floor(v);
}

function hash3(x: number, y: number, z: number): number {
  return fract(Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123);
}

function signedHash(seed: number, channel: number): number {
  return hash3(seed + channel * 19.19, channel * 7.31, seed * 0.37 + 2.0) * 2.0 - 1.0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function clamp01(value: number): number {
  return clamp(value, 0.0, 1.0);
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3.0 - 2.0 * t);
}

function valueNoise2D(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = fract(x);
  const fy = fract(y);
  const sx = fx * fx * (3.0 - 2.0 * fx);
  const sy = fy * fy * (3.0 - 2.0 * fy);

  const v00 = hash3(ix, iy, seed);
  const v10 = hash3(ix + 1.0, iy, seed);
  const v01 = hash3(ix, iy + 1.0, seed);
  const v11 = hash3(ix + 1.0, iy + 1.0, seed);

  return mix(mix(v00, v10, sx), mix(v01, v11, sx), sy);
}

function angularNoise(angle: number, seed: number): number {
  const phase0 = hash3(seed, 0.13, 1.0) * TWO_PI;
  const phase1 = hash3(seed, 1.73, 2.0) * TWO_PI;
  const phase2 = hash3(seed, 3.31, 3.0) * TWO_PI;
  const phase3 = hash3(seed, 7.07, 4.0) * TWO_PI;

  return (
    Math.sin(angle * 3.0 + phase0) * 0.42 +
    Math.sin(angle * 5.0 + phase1) * 0.30 +
    Math.sin(angle * 8.0 + phase2) * 0.20 +
    Math.sin(angle * 13.0 + phase3) * 0.08
  );
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function createCanvas(size: number): StampCanvas {
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    return canvas;
  }

  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(size, size);
  }

  throw new Error('No canvas implementation available');
}

function createCanvasRect(width: number, height: number): StampCanvas {
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }

  throw new Error('No canvas implementation available');
}

function get2DContext(canvas: StampCanvas): StampContext | null {
  return canvas.getContext('2d') as StampContext | null;
}

function screenBlend(a: number, b: number): number {
  return a + b - a * b;
}

function sampleEllipsePad(u: number, v: number, pad: EllipsePad, edgeCollapse: number, seed: number): number {
  const dx = u - pad.cx;
  const dy = v - pad.cy;
  const cosR = Math.cos(pad.rotation);
  const sinR = Math.sin(pad.rotation);

  const localX = dx * cosR + dy * sinR;
  const localY = -dx * sinR + dy * cosR;
  const nx = localX / pad.rx;
  const ny = localY / pad.ry;
  const radius = Math.hypot(nx, ny);

  if (radius > 1.35) {
    return 0.0;
  }

  const angle = Math.atan2(ny, nx);
  const outlineNoise = angularNoise(angle, seed + pad.seedOffset * 11.0);
  const fineNoise =
    valueNoise2D(nx * 2.8 + seed * 0.071, ny * 2.8 - pad.seedOffset * 0.137, seed + pad.seedOffset * 17.0) *
      2.0 -
    1.0;

  const boundary =
    1.0 + edgeCollapse * pad.roughness * (outlineNoise * 0.76 + fineNoise * 0.24);
  const adjustedRadius = radius / clamp(boundary, 0.74, 1.24);

  if (adjustedRadius >= 1.0) {
    return 0.0;
  }

  const bowl = Math.pow(Math.max(0.0, 1.0 - adjustedRadius * adjustedRadius), pad.exponent);
  const edgeBand = smoothstep(0.58, 0.98, adjustedRadius);
  const crumbleNoise = valueNoise2D(
    nx * 7.4 + seed * 0.19,
    ny * 7.4 + pad.seedOffset * 0.23,
    seed + pad.seedOffset * 23.0
  );
  const crumble = clamp(1.0 - edgeCollapse * pad.crumble * edgeBand * (0.25 + crumbleNoise * 0.75), 0.68, 1.0);

  return pad.amplitude * bowl * crumble;
}

function buildMoundPads(toes: EllipsePad[], claws: EllipsePad[]): EllipsePad[] {
  const mounds: EllipsePad[] = [];

  let toeIndex = 0;
  for (const toe of toes) {
    const forwardX = Math.sin(toe.rotation);
    const forwardY = -Math.cos(toe.rotation);
    const distance = toe.ry * 1.1 + 0.02;

    mounds.push({
      cx: toe.cx + forwardX * distance,
      cy: toe.cy + forwardY * distance,
      rx: toe.rx * 0.85,
      ry: toe.ry * 0.7,
      rotation: toe.rotation,
      amplitude: 0.46,
      exponent: 1.6,
      seedOffset: 80.0 + toeIndex,
      roughness: 0.16,
      crumble: 0.08
    });

    toeIndex += 1;
  }

  let clawIndex = 0;
  for (const claw of claws) {
    const forwardX = Math.sin(claw.rotation);
    const forwardY = -Math.cos(claw.rotation);
    const distance = claw.ry * 0.95 + 0.014;

    mounds.push({
      cx: claw.cx + forwardX * distance,
      cy: claw.cy + forwardY * distance,
      rx: Math.max(claw.rx * 2.4, 0.012),
      ry: Math.max(claw.ry * 0.68, 0.018),
      rotation: claw.rotation,
      amplitude: 0.24,
      exponent: 1.65,
      seedOffset: 90.0 + clawIndex,
      roughness: 0.14,
      crumble: 0.08
    });

    clawIndex += 1;
  }

  return mounds;
}

function makeFallbackTexture(): THREE.DataTexture {
  const fallback = new THREE.DataTexture(new Uint8Array([255, 0, 0, 255]), 1, 1, THREE.RGBAFormat);
  fallback.colorSpace = THREE.NoColorSpace;
  fallback.wrapS = THREE.ClampToEdgeWrapping;
  fallback.wrapT = THREE.ClampToEdgeWrapping;
  fallback.magFilter = THREE.LinearFilter;
  fallback.minFilter = THREE.LinearFilter;
  fallback.needsUpdate = true;
  return fallback;
}

export interface PawStampAtlas {
  texture: THREE.Texture;
  cols: number;
  rows: number;
  count: number;
  tileSize: number;
}

interface PawPads {
  central: EllipsePad[];
  toes: EllipsePad[];
  claws: EllipsePad[];
}

// Build a single paw's pad layout. Most variation is now driven by `seed`
// independently of edgeCollapse, so different seeds produce visibly distinct
// paws (toe spread, pad size, asymmetry). The metacarpal pad sits close behind
// the toes so the print reads as an anatomically tight dog paw rather than a
// scattered cluster.
function buildPawPads(opts: PawStampOptions): PawPads {
  const edgeCollapse = clamp01(finiteOr(opts.edgeCollapse, 0.0));
  const claw = clamp01(finiteOr(opts.claw, 0.0));
  const seed = finiteOr(opts.seed, 0.0);

  const jitter = 0.012 + edgeCollapse * 0.006;
  const toeJitter = 0.016 + edgeCollapse * 0.006;

  // Per-paw character (always on, not gated by edgeCollapse).
  const toeSpread = 1.0 + signedHash(seed, 100.0) * 0.1;
  const padSize = 1.0 + signedHash(seed, 101.0) * 0.08;
  const padToeGap = signedHash(seed, 102.0) * 0.014;

  const centralY = 0.6 + signedHash(seed, 2.0) * jitter;
  const centralX = 0.5 + signedHash(seed, 1.0) * jitter;

  const central: EllipsePad[] = [
    {
      cx: centralX,
      cy: centralY + 0.02,
      rx: 0.137 * padSize,
      ry: 0.121 * padSize,
      rotation: signedHash(seed, 80.0) * 0.05,
      amplitude: 0.92,
      exponent: 1.1,
      seedOffset: 1.0,
      roughness: 0.21,
      crumble: 0.1
    },
    {
      cx: centralX - 0.058 + signedHash(seed, 3.0) * jitter,
      cy: centralY - 0.038 + signedHash(seed, 4.0) * jitter,
      rx: 0.088 * padSize,
      ry: 0.074 * padSize,
      rotation: -0.22 + signedHash(seed, 81.0) * 0.06,
      amplitude: 0.82,
      exponent: 1.18,
      seedOffset: 2.0,
      roughness: 0.24,
      crumble: 0.12
    },
    {
      cx: centralX + 0.058 + signedHash(seed, 5.0) * jitter,
      cy: centralY - 0.038 + signedHash(seed, 6.0) * jitter,
      rx: 0.088 * padSize,
      ry: 0.074 * padSize,
      rotation: 0.22 + signedHash(seed, 82.0) * 0.06,
      amplitude: 0.82,
      exponent: 1.18,
      seedOffset: 3.0,
      roughness: 0.24,
      crumble: 0.12
    },
    {
      cx: centralX + signedHash(seed, 83.0) * jitter,
      cy: centralY + 0.066 + signedHash(seed, 7.0) * jitter,
      rx: 0.052 * padSize,
      ry: 0.058 * padSize,
      rotation: signedHash(seed, 84.0) * 0.08,
      amplitude: 0.72,
      exponent: 1.25,
      seedOffset: 4.0,
      roughness: 0.21,
      crumble: 0.1
    },
    {
      cx: centralX - 0.06 + signedHash(seed, 85.0) * jitter,
      cy: centralY + 0.052 + signedHash(seed, 8.0) * jitter,
      rx: 0.046 * padSize,
      ry: 0.052 * padSize,
      rotation: -0.25 + signedHash(seed, 86.0) * 0.06,
      amplitude: 0.68,
      exponent: 1.28,
      seedOffset: 4.7,
      roughness: 0.22,
      crumble: 0.11
    },
    {
      cx: centralX + 0.06 + signedHash(seed, 87.0) * jitter,
      cy: centralY + 0.052 + signedHash(seed, 9.0) * jitter,
      rx: 0.046 * padSize,
      ry: 0.052 * padSize,
      rotation: 0.25 + signedHash(seed, 88.0) * 0.06,
      amplitude: 0.68,
      exponent: 1.28,
      seedOffset: 5.4,
      roughness: 0.22,
      crumble: 0.11
    },
    {
      cx: centralX,
      cy: centralY - 0.002,
      rx: 0.094 * padSize,
      ry: 0.083 * padSize,
      rotation: 0.0,
      amplitude: 0.45,
      exponent: 1.35,
      seedOffset: 5.0,
      roughness: 0.16,
      crumble: 0.08
    }
  ];

  // Toes pulled down close to the metacarpal pad (was 0.335-0.384).
  const toeSpecs: ToeSpec[] = [
    { x: 0.354, y: 0.46, rotation: -0.36, scale: 0.95, amplitude: 0.75 },
    { x: 0.452, y: 0.425, rotation: -0.12, scale: 1.04, amplitude: 0.83 },
    { x: 0.548, y: 0.425, rotation: 0.12, scale: 1.03, amplitude: 0.82 },
    { x: 0.646, y: 0.46, rotation: 0.36, scale: 0.96, amplitude: 0.75 }
  ];
  const clawSplay = [-0.18, -0.06, 0.06, 0.18];

  const toes: EllipsePad[] = [];
  const claws: EllipsePad[] = [];
  let toeIndex = 0;

  for (const spec of toeSpecs) {
    const randomScale = 1.0 + signedHash(seed, 20.0 + toeIndex) * 0.1;
    const scale = spec.scale * randomScale;
    const rotation = spec.rotation + signedHash(seed, 30.0 + toeIndex) * 0.08;
    const rx = 0.052 * scale;
    const ry = 0.076 * scale;
    const spreadX = 0.5 + (spec.x - 0.5) * toeSpread;
    const toeX = spreadX + signedHash(seed, 40.0 + toeIndex) * toeJitter;
    const toeY = spec.y + padToeGap + signedHash(seed, 50.0 + toeIndex) * toeJitter;
    const amplitude = clamp(spec.amplitude + signedHash(seed, 60.0 + toeIndex) * 0.04, 0.66, 0.88);

    toes.push({
      cx: toeX,
      cy: toeY,
      rx,
      ry,
      rotation,
      amplitude,
      exponent: 1.16,
      seedOffset: 10.0 + toeIndex,
      roughness: 0.28,
      crumble: 0.16
    });

    if (claw > 0.01) {
      const clawRot = rotation + clawSplay[toeIndex];
      const forwardX = Math.sin(clawRot);
      const forwardY = -Math.cos(clawRot);
      const clawDistance = ry + 0.034 + claw * 0.012;

      claws.push({
        cx: toeX + forwardX * clawDistance,
        cy: toeY + forwardY * clawDistance,
        rx: 0.0105 * (0.9 + claw * 0.25) * scale,
        ry: 0.03 * (0.9 + claw * 0.35) * scale,
        rotation: clawRot,
        amplitude: claw * (0.13 + hash3(seed, 70.0 + toeIndex, 1.0) * 0.05),
        exponent: 1.35,
        seedOffset: 40.0 + toeIndex,
        roughness: 0.18,
        crumble: 0.1
      });
    }

    toeIndex += 1;
  }

  return { central, toes, claws };
}

// Paint one paw mask into the (ox, oy) tile of the given context.
// R = depression mask, G = forward toe/claw mound mask, B unused, A opaque.
function paintPaw(ctx: StampContext, ox: number, oy: number, size: number, opts: PawStampOptions): boolean {
  const edgeCollapse = clamp01(finiteOr(opts.edgeCollapse, 0.0));
  const seed = finiteOr(opts.seed, 0.0);
  const { central, toes, claws } = buildPawPads(opts);
  const mounds = buildMoundPads(toes, claws);

  let image: ImageData;
  try {
    image = ctx.createImageData(size, size);
  } catch {
    return false;
  }

  const data = image.data;
  const invSize = 1.0 / size;
  let offset = 0;

  for (let y = 0; y < size; y += 1) {
    const v = (y + 0.5) * invSize;

    for (let x = 0; x < size; x += 1) {
      const u = (x + 0.5) * invSize;

      let mask = 0.0;
      for (const pad of central) {
        mask = screenBlend(mask, sampleEllipsePad(u, v, pad, edgeCollapse, seed));
      }

      for (const pad of toes) {
        mask = Math.max(mask, sampleEllipsePad(u, v, pad, edgeCollapse, seed));
      }

      for (const pad of claws) {
        mask = Math.max(mask, sampleEllipsePad(u, v, pad, edgeCollapse, seed));
      }

      let mound = 0.0;
      for (const pad of mounds) {
        mound = Math.max(mound, sampleEllipsePad(u, v, pad, edgeCollapse * 0.65, seed));
      }

      const maskPixel = clamp01(mask);
      const moundPixel = clamp01(mound) * clamp(1.0 - maskPixel * 1.3, 0.0, 1.0);

      data[offset] = Math.round(maskPixel * 255.0);
      data[offset + 1] = Math.round(clamp01(moundPixel) * 255.0);
      data[offset + 2] = 0;
      data[offset + 3] = 255;
      offset += 4;
    }
  }

  try {
    ctx.putImageData(image, ox, oy);
  } catch {
    return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// 乾いた砂の「攪乱」スタンプ (dog-3d-app の足跡表現の移植)
//
// 現実の乾いた砂浜では肉球の形はくっきり残らない。足が沈むと縁が崩れ、
// 蹴り出しで砂が後方へ飛ぶ。ここでは解剖学的なパッド形状を描かず、
//   R = 崩れた不定形の窪み(輪郭を低次ローブ+ノイズで歪ませる)
//   G = 押し出された縁(後方バイアス)+蹴り散らしの小さな砂だまり
// のマスクを生成する。タイル上方(canvas top)が進行方向(local +y)。
// ---------------------------------------------------------------------------
function paintDisturbance(
  ctx: StampContext,
  ox: number,
  oy: number,
  size: number,
  opts: PawStampOptions
): boolean {
  const edgeCollapse = clamp01(finiteOr(opts.edgeCollapse, 0.4));
  const seed = finiteOr(opts.seed, 0.0);

  let image: ImageData;
  try {
    image = ctx.createImageData(size, size);
  } catch {
    return false;
  }

  const data = image.data;
  const invSize = 1.0 / size;

  // 窪みの基本半径(タイル正規化)。縁(~1.9r)と後方の蹴り散らしが
  // タイル(±0.5)内に収まる値。
  const baseRadius = 0.22;
  // 輪郭を歪ませる低次ローブ(真円にしない)
  const p1 = hash3(seed, 0.7, 1.0) * TWO_PI;
  const p2 = hash3(seed, 2.9, 2.0) * TWO_PI;
  const a1 = 0.16 + hash3(seed, 5.1, 3.0) * 0.14;
  const a2 = 0.1 + hash3(seed, 7.3, 4.0) * 0.12;
  // 中心の僅かなオフセット(接地の非対称性)
  const cx = 0.5 + signedHash(seed, 110.0) * 0.03;
  const cy = 0.5 + signedHash(seed, 111.0) * 0.03;

  // 蹴り散らし: 後方(canvas 下方向 = local -y)へ小さな砂だまりを散らす
  interface Blob {
    x: number;
    y: number;
    r: number;
    amp: number;
  }
  const scatter: Blob[] = [];
  const scatterCount = 3 + Math.floor(hash3(seed, 9.7, 5.0) * 2);
  for (let n = 0; n < scatterCount; n += 1) {
    const ang = Math.PI + signedHash(seed, 120.0 + n) * 0.8; // 後方中心 ±0.8rad
    // 飛距離を伸ばし「飛び散った砂」として読めるスケールに(サイクル2指摘)
    const dist = baseRadius * (1.3 + hash3(seed, 130.0 + n, 6.0) * 0.65);
    scatter.push({
      x: cx + Math.sin(ang) * dist,
      // 後方 = local -y = canvas下方向(+y)。ang=π(後方中心)で cos=-1 なので
      // 符号を反転して y を増やす(GLM-5 レビュー指摘: 前方に飛んでいた)。
      y: cy - Math.cos(ang) * dist,
      // 大きめ・なだらかな砂だまり(小さく高いと点描状に見える)
      r: baseRadius * (0.32 + hash3(seed, 140.0 + n, 7.0) * 0.28),
      amp: 0.2 + hash3(seed, 150.0 + n, 8.0) * 0.18
    });
  }

  let offset = 0;
  for (let yPx = 0; yPx < size; yPx += 1) {
    const v = (yPx + 0.5) * invSize;
    for (let xPx = 0; xPx < size; xPx += 1) {
      const u = (xPx + 0.5) * invSize;

      const dx = u - cx;
      const dy = v - cy;
      const dist = Math.hypot(dx, dy) / baseRadius;
      const theta = Math.atan2(dx, dy);

      const rEff = Math.max(
        0.55,
        1.0 + a1 * Math.sin(2.0 * theta + p1) + a2 * Math.sin(3.0 * theta + p2)
      );

      // 粒の崩れ: 内部はなだらかに、境界付近ほど強く乱す
      // (内部まで強いノイズを掛けると点描状のちらつきになる)
      const crumbleNoise = valueNoise2D(u * 7.0 + seed * 0.13, v * 7.0 - seed * 0.07, seed + 31.0);
      const edgeness = smoothstep(0.55, 1.0, Math.min(dist, 1.9));
      const crumble =
        1.0 + (crumbleNoise - 0.5) * (0.2 + (0.35 + edgeCollapse * 0.6) * edgeness * 0.6);

      let depression = 0.0;
      let raised = 0.0;

      if (dist < rEff) {
        // 崩れた窪み: 底は平らに近く、壁は外周40%に集中(実際の足跡の断面)
        const t = dist / rEff;
        depression = smoothstep(0.0, 1.0, clamp01((1.0 - t) / 0.4)) * crumble;
      } else if (dist < rEff * 1.9) {
        // 押し出された縁: 後方(canvas下=dy>0)ほど高く盛る
        const band = clamp01((dist - rEff) / (rEff * 0.9));
        const profile = Math.sin(band * Math.PI);
        const backness = dist > 1e-6 ? Math.max(0.0, dy / (dist * baseRadius)) : 0.0;
        const dirBias = 0.45 + 0.7 * Math.min(1.0, backness);
        raised = profile * dirBias * crumble * 0.62;
      }

      // 蹴り散らしの砂だまり(なだらかな小さな盛り)
      for (const blob of scatter) {
        const bd = Math.hypot(u - blob.x, v - blob.y);
        if (bd < blob.r) {
          raised += blob.amp * (1.0 - smoothstep(0.0, 1.0, bd / blob.r));
        }
      }

      const maskPixel = clamp01(depression);
      // 窪みの内側では盛りを抑制
      const raisedPixel = clamp01(raised) * clamp(1.0 - maskPixel * 1.3, 0.0, 1.0);

      data[offset] = Math.round(maskPixel * 255.0);
      data[offset + 1] = Math.round(raisedPixel * 255.0);
      data[offset + 2] = 0;
      data[offset + 3] = 255;
      offset += 4;
    }
  }

  try {
    ctx.putImageData(image, ox, oy);
  } catch {
    return false;
  }

  return true;
}

// 攪乱スタンプ版のアトラス生成。generatePawStampAtlas と同じ形式で、
// 各タイルが seed 違いの「踏み荒らされた砂」バリアントになる。
export function generateDisturbanceStampAtlas(opts: PawStampOptions, cols = 3, rows = 2): PawStampAtlas {
  const tile = Math.max(32, Math.floor(finiteOr(opts.size, 256)));
  const count = Math.max(1, cols * rows);

  const fallback = (): PawStampAtlas => ({ texture: makeFallbackTexture(), cols: 1, rows: 1, count: 1, tileSize: 1 });

  let canvas: StampCanvas;
  try {
    canvas = createCanvasRect(tile * cols, tile * rows);
  } catch {
    return fallback();
  }

  const ctx = get2DContext(canvas);
  if (!ctx) {
    return fallback();
  }

  for (let i = 0; i < count; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const variantSeed = finiteOr(opts.seed, 0.0) + i * 131.71 + 7.3;
    if (!paintDisturbance(ctx, col * tile, row * tile, tile, { ...opts, size: tile, seed: variantSeed })) {
      return fallback();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  return { texture, cols, rows, count, tileSize: tile };
}

export function generateDisturbanceStampTexture(opts: PawStampOptions): THREE.Texture {
  const size = Math.max(32, Math.floor(finiteOr(opts.size, 128)));

  let canvas: StampCanvas;
  try {
    canvas = createCanvas(size);
  } catch {
    return makeFallbackTexture();
  }

  const ctx = get2DContext(canvas);
  if (!ctx || !paintDisturbance(ctx, 0, 0, size, { ...opts, size })) {
    return makeFallbackTexture();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;

  return texture;
}

export function generatePawStampTexture(opts: PawStampOptions): THREE.Texture {
  const size = Math.max(32, Math.floor(finiteOr(opts.size, 128)));

  let canvas: StampCanvas;
  try {
    canvas = createCanvas(size);
  } catch {
    return makeFallbackTexture();
  }

  const ctx = get2DContext(canvas);
  if (!ctx || !paintPaw(ctx, 0, 0, size, { ...opts, size })) {
    return makeFallbackTexture();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;

  return texture;
}

// Pre-render `cols * rows` distinct paw variants into a single texture atlas.
// At draw time each footprint picks a tile by its seed, giving shape variety
// with only one texture bind/fetch (mobile friendly). Mipmaps are disabled so
// neighbouring tiles never bleed into each other.
export function generatePawStampAtlas(opts: PawStampOptions, cols = 3, rows = 2): PawStampAtlas {
  const tile = Math.max(32, Math.floor(finiteOr(opts.size, 256)));
  const count = Math.max(1, cols * rows);

  const fallback = (): PawStampAtlas => ({ texture: makeFallbackTexture(), cols: 1, rows: 1, count: 1, tileSize: 1 });

  let canvas: StampCanvas;
  try {
    canvas = createCanvasRect(tile * cols, tile * rows);
  } catch {
    return fallback();
  }

  const ctx = get2DContext(canvas);
  if (!ctx) {
    return fallback();
  }

  for (let i = 0; i < count; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const variantSeed = finiteOr(opts.seed, 0.0) + i * 131.71 + 7.3;
    if (!paintPaw(ctx, col * tile, row * tile, tile, { ...opts, size: tile, seed: variantSeed })) {
      return fallback();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  return { texture, cols, rows, count, tileSize: tile };
}
