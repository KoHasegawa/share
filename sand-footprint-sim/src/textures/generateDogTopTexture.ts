import * as THREE from 'three';

export interface DogTextureOptions {
  size: number;
  seed: number;
  bodyColor?: THREE.ColorRepresentation;
  bellyColor?: THREE.ColorRepresentation;
}

function colorToCss(color: THREE.ColorRepresentation): string {
  return `#${new THREE.Color(color).getHexString()}`;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawEllipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rotation: number,
  fillStyle: string
): void {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function drawSoftShadow(ctx: CanvasRenderingContext2D, size: number): void {
  const cx = size * 0.5;
  const cy = size * 0.54;
  const gradient = ctx.createRadialGradient(cx, cy, size * 0.06, cx, cy, size * 0.38);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.16)');
  gradient.addColorStop(0.62, 'rgba(0, 0, 0, 0.08)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(cx, cy, size * 0.34, size * 0.41, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Generate a procedural top-down dog texture.
 *
 * Direction convention: texture +V (top of the canvas) is the nose / travel
 * direction. The transparent texture is centre-anchored at (0.5, 0.5).
 */
export function generateDogTopTexture(opts: DogTextureOptions): THREE.Texture {
  const size = Math.max(32, Math.floor(opts.size));
  const random = mulberry32(Math.floor(opts.seed * 1009) ^ 0xa53a9d1b);

  const palette = ['#7a4b2a', '#a66b3f', '#d5b27c', '#ece0ca', '#2f2621', '#8f8a82'];
  const bodyColor = colorToCss(opts.bodyColor ?? palette[Math.floor(random() * palette.length)]);
  const bellyColor = colorToCss(opts.bellyColor ?? (random() < 0.55 ? '#f1e4cf' : '#d1c0a6'));
  const darkColor = colorToCss(new THREE.Color(bodyColor).multiplyScalar(0.58));
  const noseColor = '#171311';
  const eyeColor = '#120f0e';

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas2D context unavailable for dog texture generation');
  }

  ctx.clearRect(0, 0, size, size);
  drawSoftShadow(ctx, size);

  const cx = size * 0.5;
  const cy = size * 0.51;

  const spotCount = 1 + Math.floor(random() * 3);
  const hasBlaze = random() < 0.62;
  const hasTailTip = random() < 0.7;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Tail, drawn first so it tucks behind the body. It curves toward one side.
  const tailSide = random() < 0.5 ? -1 : 1;
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = size * 0.065;
  ctx.beginPath();
  ctx.moveTo(cx + tailSide * size * 0.07, cy + size * 0.31);
  ctx.quadraticCurveTo(
    cx + tailSide * size * 0.24,
    cy + size * 0.39,
    cx + tailSide * size * 0.18,
    cy + size * 0.17
  );
  ctx.stroke();

  if (hasTailTip) {
    ctx.strokeStyle = bellyColor;
    ctx.lineWidth = size * 0.04;
    ctx.beginPath();
    ctx.moveTo(cx + tailSide * size * 0.2, cy + size * 0.32);
    ctx.quadraticCurveTo(
      cx + tailSide * size * 0.25,
      cy + size * 0.29,
      cx + tailSide * size * 0.21,
      cy + size * 0.19
    );
    ctx.stroke();
  }

  // Legs.
  const legW = size * 0.055;
  const legH = size * 0.18;
  drawEllipse(ctx, cx - size * 0.18, cy - size * 0.14, legW, legH, -0.18, darkColor);
  drawEllipse(ctx, cx + size * 0.18, cy - size * 0.14, legW, legH, 0.18, darkColor);
  drawEllipse(ctx, cx - size * 0.16, cy + size * 0.17, legW, legH, 0.16, darkColor);
  drawEllipse(ctx, cx + size * 0.16, cy + size * 0.17, legW, legH, -0.16, darkColor);

  // Body and chest/belly marking.
  drawEllipse(ctx, cx, cy + size * 0.04, size * 0.19, size * 0.32, 0, bodyColor);
  drawEllipse(ctx, cx, cy - size * 0.02, size * 0.105, size * 0.24, 0, bellyColor);

  // Body patches.
  ctx.fillStyle = darkColor;
  for (let i = 0; i < spotCount; i += 1) {
    const px = cx + (random() - 0.5) * size * 0.26;
    const py = cy - size * 0.07 + (random() - 0.5) * size * 0.37;
    const rx = size * (0.035 + random() * 0.045);
    const ry = size * (0.045 + random() * 0.06);
    drawEllipse(ctx, px, py, rx, ry, random() * Math.PI, darkColor);
  }

  // Neck and head.
  drawEllipse(ctx, cx, cy - size * 0.265, size * 0.105, size * 0.105, 0, bodyColor);
  drawEllipse(ctx, cx, cy - size * 0.365, size * 0.145, size * 0.14, 0, bodyColor);

  // Ears.
  drawEllipse(ctx, cx - size * 0.12, cy - size * 0.365, size * 0.06, size * 0.15, -0.48, darkColor);
  drawEllipse(ctx, cx + size * 0.12, cy - size * 0.365, size * 0.06, size * 0.15, 0.48, darkColor);

  // Muzzle, blaze, nose and eyes.
  drawEllipse(ctx, cx, cy - size * 0.435, size * 0.075, size * 0.065, 0, bellyColor);

  if (hasBlaze) {
    ctx.fillStyle = bellyColor;
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.515);
    ctx.quadraticCurveTo(cx - size * 0.035, cy - size * 0.42, cx - size * 0.018, cy - size * 0.31);
    ctx.quadraticCurveTo(cx + size * 0.02, cy - size * 0.31, cx + size * 0.035, cy - size * 0.42);
    ctx.closePath();
    ctx.fill();
  }

  drawEllipse(ctx, cx, cy - size * 0.49, size * 0.025, size * 0.019, 0, noseColor);
  drawEllipse(ctx, cx - size * 0.052, cy - size * 0.405, size * 0.012, size * 0.016, 0, eyeColor);
  drawEllipse(ctx, cx + size * 0.052, cy - size * 0.405, size * 0.012, size * 0.016, 0, eyeColor);

  // Subtle outline to read on pale sand.
  ctx.globalCompositeOperation = 'source-atop';
  ctx.strokeStyle = 'rgba(40, 28, 20, 0.22)';
  ctx.lineWidth = size * 0.012;
  ctx.beginPath();
  ctx.ellipse(cx, cy + size * 0.04, size * 0.19, size * 0.32, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, cy - size * 0.365, size * 0.145, size * 0.14, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  return texture;
}
