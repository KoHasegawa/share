import * as THREE from 'three';

export interface PawStampOptions {
  size: number;
  edgeCollapse: number;
  seed: number;
  claw: number;
}

function fract(v: number): number {
  return v - Math.floor(v);
}

function hash3(x: number, y: number, z: number): number {
  return fract(Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123);
}

function createCanvas(size: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(size, size);
  }

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function drawIrregularBlob(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rotation: number,
  edgeCollapse: number,
  seed: number,
  points = 40
): void {
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);

  ctx.beginPath();
  for (let i = 0; i <= points; i += 1) {
    const t = (i / points) * Math.PI * 2;
    const bx = Math.cos(t);
    const by = Math.sin(t);

    const n1 = hash3(bx * 1.7 + seed, by * 1.7, seed + 0.13);
    const n2 = hash3(bx * 3.3 + seed * 1.1, by * 3.3, seed + 0.47);
    const irregular = 1.0 - edgeCollapse * 0.35 + (n1 * 2.0 - 1.0) * edgeCollapse * 0.32 + (n2 * 2.0 - 1.0) * edgeCollapse * 0.18;

    const ex = bx * rx * irregular;
    const ey = by * ry * irregular;

    const px = cx + ex * cosR - ey * sinR;
    const py = cy + ex * sinR + ey * cosR;

    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fill();
}

export function generatePawStampTexture(opts: PawStampOptions): THREE.Texture {
  const size = Math.max(32, Math.floor(opts.size));
  const edgeCollapse = THREE.MathUtils.clamp(opts.edgeCollapse, 0, 1);
  const claw = THREE.MathUtils.clamp(opts.claw, 0, 1);
  const seed = opts.seed;

  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const fallback = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, THREE.RGBAFormat);
    fallback.needsUpdate = true;
    return fallback;
  }

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);

  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#ffffff';

  const s = size;

  const centralX = s * 0.5;
  const centralY = s * 0.62;

  drawIrregularBlob(ctx, centralX, centralY, s * 0.145, s * 0.132, 0.0, edgeCollapse, seed + 1.0, 48);
  drawIrregularBlob(ctx, centralX - s * 0.065, centralY - s * 0.04, s * 0.075, s * 0.06, -0.22, edgeCollapse, seed + 2.0, 32);
  drawIrregularBlob(ctx, centralX + s * 0.065, centralY - s * 0.04, s * 0.075, s * 0.06, 0.22, edgeCollapse, seed + 3.0, 32);
  drawIrregularBlob(ctx, centralX, centralY + s * 0.052, s * 0.07, s * 0.072, 0.0, edgeCollapse, seed + 4.0, 30);

  const toeFanY = s * 0.37;
  const toeSpacing = s * 0.09;
  const toeRot = [-0.34, -0.13, 0.13, 0.34];
  const toeScale = [1.0, 0.95, 0.95, 1.0];

  for (let i = 0; i < 4; i += 1) {
    const tx = centralX + (i - 1.5) * toeSpacing;
    const ty = toeFanY - Math.abs(i - 1.5) * s * 0.015;
    const rx = s * 0.055 * toeScale[i];
    const ry = s * 0.075 * toeScale[i];
    drawIrregularBlob(ctx, tx, ty, rx, ry, toeRot[i], edgeCollapse, seed + 10.0 + i, 34);

    if (claw > 0.01) {
      const clawLen = s * (0.03 + claw * 0.02);
      const clawW = s * 0.012;
      const forward = -1.0;
      const dirX = Math.sin(toeRot[i]) * forward;
      const dirY = Math.cos(toeRot[i]) * forward;

      const cx = tx + dirX * (ry + s * 0.015);
      const cy = ty + dirY * (ry + s * 0.015);

      drawIrregularBlob(
        ctx,
        cx,
        cy,
        clawW * (1.0 + 0.25 * claw),
        clawLen * (0.8 + 0.2 * claw),
        toeRot[i],
        edgeCollapse * 0.35,
        seed + 40.0 + i,
        18
      );
    }
  }

  const img = ctx.getImageData(0, 0, size, size);
  const data = img.data;
  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % size;
    const y = Math.floor(i / 4 / size);

    const n = hash3(x * 0.083, y * 0.083, seed + 99.0);
    const collapseNoise = 1.0 - edgeCollapse * 0.28 + (n * 2.0 - 1.0) * edgeCollapse * 0.22;

    const v = data[i] / 255;
    const shaped = Math.pow(v, 0.82) * collapseNoise;
    const out = Math.round(THREE.MathUtils.clamp(shaped, 0, 1) * 255);

    data[i] = out;
    data[i + 1] = out;
    data[i + 2] = out;
    data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);

  const texture = new THREE.CanvasTexture(canvas as HTMLCanvasElement);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;

  return texture;
}
